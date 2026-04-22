export type TaskStatus = 'active' | 'aging' | 'completed';
export type TaskCategory = 'academic' | 'life' | 'creative' | 'recovery' | 'focus' | 'reward';

export interface MicroAction {
  id: string;
  text: string;
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
