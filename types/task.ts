export type TaskStatus = 'active' | 'aging' | 'completed';
// study = 学习, work = 工作 (renamed from academic/focus for clarity)
export type TaskCategory = 'study' | 'life' | 'creative' | 'recovery' | 'work' | 'reward';

export interface MicroAction {
  id: string;
  text: string;
  duration?: string;       // e.g. "5-10 mins"
  sensory_tip?: string;    // e.g. "dim the lights"
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  importance: number;       // 1-5, maps to bubble radius
  urgency: number;          // 1-5, maps to color (red -> purple -> blue)
  energyCost: number;       // 1-5, maps to turbidity/opacity
  bartender_comment?: string;
  microActions: MicroAction[];

  // Physics state (not persisted)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;

  // Timestamps
  createdAt: number;
  agedAt?: number;           // when dragged to barrel
  completedAt?: number;

  // Aging countdown (21 days)
  agingDeadline?: number;
}

export type ViewMode = 'panorama' | 'focus';
