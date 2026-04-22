/**
 * 智能材料库 – Main Dashboard
 * Physics bubble canvas + NLP input + mode toggle + barrel drop zone
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTaskStore } from '../../store/taskStore';
import { usePhysics } from '../../hooks/usePhysics';
import { BubbleItem } from '../../components/BubbleItem';
import { MicroActionsSheet } from '../../components/MicroActionsSheet';
import { MascotMessage, Mascot } from '../../components/MascotMessage';
import { GlassButton } from '../../components/GlassButton';
import { Task, TaskCategory } from '../../types/task';
import { GLASS, BRAND } from '../../constants/colors';

const { width: W, height: H } = Dimensions.get('window');
const BARREL_Y = H - 80;

// --- Simple NLP heuristic: extract category/importance/urgency/energyCost ---
function parseInput(text: string): Pick<Task, 'title' | 'category' | 'importance' | 'urgency' | 'energyCost'> {
  const lower = text.toLowerCase();
  let category: TaskCategory = 'life';
  if (/论文|作业|学习|考试|研究|读书/.test(lower))      category = 'academic';
  else if (/创意|设计|写作|画|音乐|拍摄/.test(lower))   category = 'creative';
  else if (/恢复|休息|睡觉|放松|散步/.test(lower))       category = 'recovery';
  else if (/专注|冥想|计划|整理/.test(lower))            category = 'focus';
  else if (/奖励|购物|游戏|庆祝/.test(lower))            category = 'reward';

  const urgency    = /紧急|今天|立刻|马上|deadline/.test(lower) ? 1
                   : /明天|这周/.test(lower) ? 2
                   : /下周/.test(lower) ? 3
                   : /下个月/.test(lower) ? 4 : 3;

  const importance = /重要|关键|必须|核心/.test(lower) ? 5
                   : /比较重要|应该/.test(lower) ? 4
                   : /可以|可能/.test(lower) ? 2 : 3;

  const energyCost = /累|难|复杂|费力|挑战/.test(lower) ? 4
                   : /简单|轻松|快速/.test(lower) ? 2 : 3;

  return { title: text.trim(), category, importance, urgency, energyCost };
}

export default function DashboardScreen() {
  const {
    getActiveTasks, addTask, ageTask,
    viewMode, setViewMode, focusedTaskIds,
  } = useTaskStore();

  const [inputText, setInputText]       = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [mascot, setMascot]             = useState<{ mascot: Mascot; msg: string; visible: boolean }>({
    mascot: 'magpie', msg: '', visible: false,
  });

  usePhysics(W, H);

  const activeTasks = getActiveTasks();

  const showMascot = useCallback((m: Mascot, msg: string) => {
    setMascot({ mascot: m, msg, visible: true });
    setTimeout(() => setMascot((s) => ({ ...s, visible: false })), 5000);
  }, []);

  const handleAddTask = useCallback(() => {
    if (!inputText.trim()) return;
    const parsed = parseInput(inputText);
    addTask(parsed);
    setInputText('');
    if (activeTasks.length === 0) {
      showMascot('magpie', '不错！第一个气泡诞生了。把手机轻轻倾斜，看看它会飘向哪里 ✨');
    }
  }, [inputText, activeTasks.length, addTask, showMascot]);

  const handleModeToggle = useCallback(() => {
    const next = viewMode === 'panorama' ? 'focus' : 'panorama';
    if (next === 'focus') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setViewMode(next);
    if (next === 'focus') {
      showMascot('magpie', '专注模式已开启 — 只看最重要的三件事。');
    }
  }, [viewMode, setViewMode, showMascot]);

  const handleDoubleTap = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  const handleBarrelDrop = useCallback((task: Task) => {
    ageTask(task.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showMascot('sloth', '好的，这个任务去酒桶陈酿 21 天。到时候你会更从容地面对它 🛢');
  }, [ageTask, showMascot]);

  return (
    <View style={styles.root}>
      {/* Animated background gradient */}
      <LinearGradient
        colors={[BRAND.deepNavy, BRAND.indigo, BRAND.royalPurple, BRAND.magenta]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Bubble Bar</Text>
          <TouchableOpacity onPress={handleModeToggle} style={styles.modeBtn}>
            <BlurView intensity={22} tint="dark" style={styles.modeBtnInner}>
              <Text style={styles.modeBtnText}>
                {viewMode === 'panorama' ? '全景' : '专注'}
              </Text>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Bubble canvas */}
        <View style={styles.canvas} pointerEvents="box-none">
          {activeTasks.map((task) => (
            <BubbleItem
              key={task.id}
              task={task}
              isFocused={focusedTaskIds.includes(task.id)}
              viewMode={viewMode}
              barrelY={BARREL_Y}
              onDoubleTap={handleDoubleTap}
              onDrop={handleBarrelDrop}
            />
          ))}
          {activeTasks.length === 0 && (
            <View style={styles.emptyHint}>
              <Text style={styles.emptyText}>在下方输入一个任务{'\n'}让气泡飞起来 ✦</Text>
            </View>
          )}
        </View>

        {/* Barrel drop zone */}
        <View style={styles.barrelZone}>
          <BlurView intensity={18} tint="dark" style={styles.barrelIcon}>
            <Text style={styles.barrelEmoji}>🛢</Text>
            <Text style={styles.barrelLabel}>酒桶</Text>
          </BlurView>
        </View>

        {/* NLP input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputArea}
        >
          <BlurView intensity={40} tint="dark" style={styles.inputWrapper}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleAddTask}
              placeholder="输入任务，AI 自动生成气泡…"
              placeholderTextColor={GLASS.textSecondary}
              style={styles.input}
              returnKeyType="done"
              multiline={false}
            />
            <TouchableOpacity onPress={handleAddTask} style={styles.sendBtn}>
              <Text style={styles.sendIcon}>⊕</Text>
            </TouchableOpacity>
          </BlurView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Mascot overlay */}
      <MascotMessage mascot={mascot.mascot} message={mascot.msg} visible={mascot.visible} />

      {/* Micro-actions sheet */}
      <MicroActionsSheet task={selectedTask} onClose={() => setSelectedTask(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BRAND.deepNavy },
  safe:   { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  logo:   { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  modeBtn:      { borderRadius: 14, overflow: 'hidden' },
  modeBtnInner: { paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: GLASS.border, borderRadius: 14 },
  modeBtnText:  { color: '#fff', fontSize: 13, fontWeight: '600' },

  canvas:  { flex: 1 },
  emptyHint: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: GLASS.textSecondary, textAlign: 'center', fontSize: 15, lineHeight: 24 },

  barrelZone: {
    position: 'absolute',
    bottom: 95,
    right: 24,
  },
  barrelIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  barrelEmoji: { fontSize: 22 },
  barrelLabel: { color: GLASS.textSecondary, fontSize: 9, marginTop: 1 },

  inputArea: { paddingHorizontal: 16, paddingBottom: 12 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: GLASS.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  input: {
    flex: 1,
    color: GLASS.textPrimary,
    fontSize: 15,
    paddingVertical: 10,
  },
  sendBtn:  { padding: 6 },
  sendIcon: { color: '#fff', fontSize: 22 },
});
