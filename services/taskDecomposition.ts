/**
 * TaskDecompositionService
 * Routes each task category to a specialized system prompt designed for ADHD neurodiversity.
 * Uses DeepSeek API (OpenAI-compatible). Set EXPO_PUBLIC_DEEPSEEK_API_KEY in .env.
 */
import { TaskCategory, MicroAction } from '../types/task';

const API_URL = 'https://api.deepseek.com/chat/completions';
const API_KEY = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY ?? '';

// ─── Output schema from DeepSeek ─────────────────────────────────────────────

export interface DecomposedStep {
  id: number;
  action: string;
  duration: string;
  sensory_tip?: string;
}

export interface DecomposedTask {
  task_name: string;
  category: string;
  energy_cost: number;      // 1-5
  priority_weight: number;  // 1-10
  steps: DecomposedStep[];
  bartender_comment: string;
}

// ─── Category config: persona + specialized system prompt ────────────────────

type Persona = 'sloth' | 'magpie';

interface CategoryConfig {
  persona: Persona;
  systemPrompt: string;
}

const JSON_SCHEMA = `
必须只返回如下 JSON，不加任何额外文字或代码块标记：
{
  "task_name": "任务名称",
  "category": "<分类英文名>",
  "energy_cost": <1-5整数，1=轻松，5=费力>,
  "priority_weight": <1-10整数，重要程度>,
  "steps": [
    {
      "id": 1,
      "action": "以动词开头的具体执行指令",
      "duration": "5-10 mins",
      "sensory_tip": "（可选）光线/声音/感官建议"
    }
  ],
  "bartender_comment": "调酒师的一句无压力鼓励"
}`;

const CONFIGS: Record<TaskCategory, CategoryConfig> = {
  life: {
    persona: 'sloth',
    systemPrompt: `你是"树懒调酒师"，一位温柔接地气的生活任务向导，专为 ADHD 大脑设计。

拆解原则：
- 聚焦【身体动作】：每一步都是真实可感知的物理动作（"站起来"、"拿起袜子"）
- 严禁："思考"、"考虑"、"计划"、"决定"开头的步骤
- 每步时长：5-10 分钟
- 步骤数：4-6 个
- 语调：温柔、接地气，如轻声说话
- category 字段固定填写 "Life"

${JSON_SCHEMA}`,
  },

  study: {
    persona: 'magpie',
    systemPrompt: `你是"水星喜鹊"，一位充满活力的学习教练，用知识区块法帮助 ADHD 大脑学习。

拆解原则：
- 聚焦【知识区块】：每步对应具体内容范围（"打开教材读第5-10页"，而非"理解X概念"）
- 每步时长：上限 15 分钟
- 第一步必须是打开材料/定位页面/播放视频的物理动作
- 严禁："理解"、"掌握"、"学会"开头
- 步骤数：4-6 个
- 语调：鼓励性，像学术教练
- category 字段固定填写 "Study"

${JSON_SCHEMA}`,
  },

  work: {
    persona: 'magpie',
    systemPrompt: `你是"水星喜鹊"，一位高效工作流专家，专为 ADHD 大脑消除决策摩擦。

拆解原则：
- 聚焦【决策消除】：将所有"我要怎么做"直接转化为"立刻执行"
- 第一步必须是"30秒冷启动"：打开文件/点击按钮/写下第一个词（不超过30秒）
- 步骤数：4-6 个，每步无需决策
- 每步时长：5-15 分钟
- 语调：简洁专业，零摩擦
- category 字段固定填写 "Work"

${JSON_SCHEMA}`,
  },

  creative: {
    persona: 'magpie',
    systemPrompt: `你是"水星喜鹊"，一位充满想象力的创意仪式设计师，帮 ADHD 大脑进入心流状态。

拆解原则：
- 聚焦【仪式感与玩耍】：前 2 步必须是环境布置（"点一支蜡烛"、"打开 lo-fi 音乐"）
- 步骤数：5-7 个
- 不设"正确答案"，允许混乱与探索
- 语调：异想天开、无边界，像在玩耍
- category 字段固定填写 "Creative"

${JSON_SCHEMA}`,
  },

  recovery: {
    persona: 'sloth',
    systemPrompt: `你是"树懒调酒师"，一位超级温柔的感官减压向导，专为 ADHD 大脑降低认知负荷。

拆解原则：
- 聚焦【感官减量】：每步都在降低外部刺激（"调暗灯光"、"把手机放到另一个房间"）
- 步骤数：3-5 个，越少越好
- 每步时长：5-10 分钟
- energy_cost 应为 1-3（恢复类本应轻松）
- 严禁任何"应该"、"必须"
- 语调：如耳语，超轻柔，零压力
- category 字段固定填写 "Recovery"

${JSON_SCHEMA}`,
  },

  reward: {
    persona: 'sloth',
    systemPrompt: `你是"树懒调酒师"，一位专注当下快乐的奖励仪式设计师，帮 ADHD 大脑无愧疚地享受奖励。

拆解原则：
- 聚焦【全身心沉浸】：第一步必须是准备最喜欢的零食或饮料
- 步骤数：4-6 个
- 每步都在增强享受，消除"还没做完"的愧疚感
- energy_cost 应为 1-2（奖励应该轻松）
- 语调：欢庆、正念、充满爱
- category 字段固定填写 "Reward"

${JSON_SCHEMA}`,
  },
};

// ─── 30-Second Rule validator ─────────────────────────────────────────────────

const THINKING_VERBS = /^(思考|考虑|决定|计划|想想|分析|评估|想一想|想好)/;

async function refineFirstStep(
  originalTask: string,
  category: TaskCategory,
  badStep: DecomposedStep,
): Promise<DecomposedStep> {
  const config = CONFIGS[category];
  const refinementPrompt = `用户的任务是："${originalTask}"

当前第一步是："${badStep.action}"
这个步骤包含思考/决策动作，不符合 ADHD 友好原则。

请把它替换成一个具体的、5秒内可开始的物理"冷启动"动作。
只返回一句话，以动词开头，描述最小物理动作。不加任何解释。`;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: refinementPrompt },
        ],
        max_tokens: 80,
        temperature: 0.5,
      }),
    });
    const data = await res.json();
    const refined = data.choices?.[0]?.message?.content?.trim();
    if (refined) return { ...badStep, action: refined };
  } catch {
    // fall through to original
  }
  return badStep;
}

// ─── Main decomposition function ─────────────────────────────────────────────

export async function decomposeTask(
  userInput: string,
  category: TaskCategory,
): Promise<DecomposedTask> {
  if (!API_KEY) throw new Error('EXPO_PUBLIC_DEEPSEEK_API_KEY is not set');

  const config = CONFIGS[category];

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: `请帮我拆解这个任务："${userInput}"` },
      ],
      max_tokens: 800,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty response from DeepSeek');

  let result: DecomposedTask;
  try {
    result = JSON.parse(raw);
  } catch {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    result = JSON.parse(cleaned);
  }

  // Validate and clamp numeric fields
  result.energy_cost = Math.min(5, Math.max(1, Math.round(result.energy_cost ?? 3)));
  result.priority_weight = Math.min(10, Math.max(1, Math.round(result.priority_weight ?? 5)));

  // 30-Second Rule: if the first step involves thinking, force a physical cold start
  if (result.steps?.length > 0 && THINKING_VERBS.test(result.steps[0].action)) {
    result.steps[0] = await refineFirstStep(userInput, category, result.steps[0]);
  }

  return result;
}

// ─── Map AI output → Task store fields ───────────────────────────────────────

export function mapToMicroActions(steps: DecomposedStep[]): MicroAction[] {
  return steps.map((s) => ({
    id: String(s.id),
    text: s.action,
    duration: s.duration,
    sensory_tip: s.sensory_tip,
    done: false,
  }));
}

export function getPersona(category: TaskCategory): 'sloth' | 'magpie' {
  return CONFIGS[category].persona;
}
