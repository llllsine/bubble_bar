import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskStatus, MicroAction, ViewMode } from '../types/task';

const AGING_DAYS = 21;

interface TaskStore {
  tasks: Task[];
  viewMode: ViewMode;
  focusedTaskIds: string[];   // top-3 in focus mode

  // --- Mutations ---
  addTask: (draft: Pick<Task, 'title' | 'category' | 'importance' | 'urgency' | 'energyCost'>) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;

  ageTask: (id: string) => void;            // active → aging (barrel)
  recallTask: (id: string) => void;         // aging → active
  completeTask: (id: string) => void;       // active → completed

  toggleMicroAction: (taskId: string, actionId: string) => void;

  setViewMode: (mode: ViewMode) => void;
  updateBubblePosition: (id: string, x: number, y: number) => void;

  // Derived selectors (cheap, no memoization needed at this scale)
  getActiveTasks: () => Task[];
  getAgingTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getTopThree: () => Task[];
}

let nextId = Date.now();
const uid = () => String(++nextId);

const defaultMicroActions = (title: string): MicroAction[] => [
  { id: uid(), text: `打开与「${title}」相关的文件`, done: false },
  { id: uid(), text: '设置 5 分钟计时器', done: false },
  { id: uid(), text: '写下第一步要做什么', done: false },
  { id: uid(), text: '完成最小可行进度', done: false },
  { id: uid(), text: '整理并保存当前进度', done: false },
];

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      viewMode: 'panorama',
      focusedTaskIds: [],

      addTask: (draft) => {
        const task: Task = {
          id: uid(),
          ...draft,
          status: 'active',
          microActions: defaultMicroActions(draft.title),
          createdAt: Date.now(),
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
      },

      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      removeTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      ageTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: 'aging' as TaskStatus,
                  agedAt: Date.now(),
                  agingDeadline: Date.now() + AGING_DAYS * 24 * 60 * 60 * 1000,
                }
              : t
          ),
        })),

      recallTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'active' as TaskStatus, agedAt: undefined, agingDeadline: undefined }
              : t
          ),
        })),

      completeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'completed' as TaskStatus, completedAt: Date.now() }
              : t
          ),
        })),

      toggleMicroAction: (taskId, actionId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id !== taskId
              ? t
              : {
                  ...t,
                  microActions: t.microActions.map((a) =>
                    a.id === actionId ? { ...a, done: !a.done } : a
                  ),
                }
          ),
        })),

      setViewMode: (mode) => {
        const top3 = get()
          .getActiveTasks()
          .sort((a, b) => b.urgency * b.importance - a.urgency * a.importance)
          .slice(0, 3)
          .map((t) => t.id);
        set({ viewMode: mode, focusedTaskIds: mode === 'focus' ? top3 : [] });
      },

      updateBubblePosition: (id, x, y) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, x, y } : t)),
        })),

      getActiveTasks: () => get().tasks.filter((t) => t.status === 'active'),
      getAgingTasks: () => get().tasks.filter((t) => t.status === 'aging'),
      getCompletedTasks: () => get().tasks.filter((t) => t.status === 'completed'),
      getTopThree: () =>
        get()
          .getActiveTasks()
          .sort((a, b) => b.urgency * b.importance - a.urgency * a.importance)
          .slice(0, 3),
    }),
    {
      name: 'bubble-bar-tasks',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist ephemeral physics state
      partialize: (s) => ({
        tasks: s.tasks.map(({ x, y, vx, vy, ...rest }) => rest),
      }),
    }
  )
);
