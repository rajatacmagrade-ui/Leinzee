export interface Task {
  id: string;
  title: string;
  deadline: string;
  status: 'pending' | 'completed';
  tokens: number;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  completedAt?: string;
  caption?: string;
  hashtags?: string[];
  mentions?: string[];
}

export interface UserStats {
  totalTokens: number;
  weeklyCompletedTasks: number;
  weeklyTotalTasks: number;
  weeklyTokenEarnings: number;
  lifetimeCompletedTasks: number;
}

export interface Notification {
  id: string;
  type: 'deadline' | 'pending' | 'reward';
  title?: string;
  message: string;
  read: boolean;
  createdAt: string;
}
