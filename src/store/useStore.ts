import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, subDays, getISOWeek } from 'date-fns';
import { Task, UserStats, Notification } from '../types';

interface AppState {
  tasks: Task[];
  stats: UserStats;
  notifications: Notification[];
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string | null;
  weekKey: string;
  instagramUser: string | null;
  setInstagramUser: (username: string | null) => void;
  updateProfile: (data: { name: string; gender: string }) => void;
  addTask: (task: Task) => void;
  markTaskComplete: (taskId: string) => void;
  redeemItem: (cost: number) => boolean;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  loadFromDB: () => Promise<void>;
  getScore: () => number;
  getTier: () => string;
  getWeeklyData: () => { day: string; count: number }[];
}

const getCurrentWeekKey = () => {
  const now = new Date();
  const weekNum = getISOWeek(now);
  return `${now.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
};

const detectPriority = (deadline: string): 'high' | 'medium' | 'low' => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil <= 3) return 'high';
  if (daysUntil <= 7) return 'medium';
  return 'low';
};

const safeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      stats: {
        totalTokens: 0,
        weeklyCompletedTasks: 0,
        weeklyTotalTasks: 0,
        weeklyTokenEarnings: 0,
        lifetimeCompletedTasks: 0,
      },
      notifications: [],
      currentStreak: 0,
      longestStreak: 0,
      lastCompletionDate: null,
      instagramUser: null,
      weekKey: getCurrentWeekKey(),

      setInstagramUser: (username) => set({ instagramUser: username }),

      updateProfile: (data) => set((state) => ({
        stats: {
          ...state.stats,
          userName: data.name,
          userGender: data.gender,
        }
      })),

      addTask: (task) => set((state) => {
        const taskWithPriority = {
          ...task,
          priority: task.priority || detectPriority(task.deadline),
        };
        return {
          tasks: [...state.tasks, taskWithPriority],
          stats: {
            ...state.stats,
            weeklyTotalTasks: state.stats.weeklyTotalTasks + 1,
          },
          notifications: [
            ...state.notifications,
            {
              id: safeId(),
              type: 'pending' as const,
              title: 'Task Added',
              message: `New task tracking: ${task.title}`,
              read: false,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }),

      markTaskComplete: (taskId) => set((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task || task.status === 'completed') return state;

        const today = format(new Date(), 'yyyy-MM-dd');
        const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

        let newStreak = state.currentStreak;
        if (state.lastCompletionDate !== today) {
          if (state.lastCompletionDate === yesterday) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
        }

        const updatedTasks = state.tasks.map((t) =>
          t.id === taskId ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() } : t
        );
        const newStats = {
          ...state.stats,
          totalTokens: state.stats.totalTokens + task.tokens,
          weeklyCompletedTasks: state.stats.weeklyCompletedTasks + 1,
          weeklyTokenEarnings: state.stats.weeklyTokenEarnings + task.tokens,
          lifetimeCompletedTasks: state.stats.lifetimeCompletedTasks + 1,
        };

        return {
          tasks: updatedTasks,
          stats: newStats,
          currentStreak: newStreak,
          longestStreak: Math.max(state.longestStreak, newStreak),
          lastCompletionDate: today,
          notifications: [
            ...state.notifications,
            {
              id: safeId(),
              type: 'reward' as const,
              title: 'Tokens Rewarded',
              message: `Earned ${task.tokens} tokens for completing ${task.title}!`,
              read: false,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }),

      redeemItem: (cost) => {
        const state = get();
        if (state.stats.totalTokens >= cost) {
          set({ stats: { ...state.stats, totalTokens: state.stats.totalTokens - cost } });
          return true;
        }
        return false;
      },

      loadFromDB: async () => {
        // localStorage is the primary store; backend sync removed
      },

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      getScore: () => {
        const state = get();
        const baseScore =
          (state.stats.weeklyCompletedTasks / Math.max(state.stats.weeklyTotalTasks, 1)) * 100;
        const streakBonus = Math.min(state.currentStreak * 5, 25);
        return Math.min(Math.max(Math.round(baseScore + streakBonus), 0), 100);
      },

      getTier: () => {
        const score = get().getScore();
        if (score <= 20) return 'Getting Started';
        if (score <= 40) return 'Building Momentum';
        if (score <= 60) return 'On Fire';
        if (score <= 80) return 'Elite';
        return 'Legendary';
      },

      getWeeklyData: () => {
        const state = get();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        return days.map((day, i) => {
          const dayDate = new Date(today);
          dayDate.setDate(today.getDate() - ((today.getDay() - i + 7) % 7));
          const dayStr = format(dayDate, 'yyyy-MM-dd');
          const count = state.tasks.filter(
            (t) =>
              t.status === 'completed' &&
              t.completedAt &&
              format(new Date(t.completedAt), 'yyyy-MM-dd') === dayStr
          ).length;
          return { day, count };
        });
      },
    }),
    {
      name: 'reel-to-action-storage',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const currentWeekKey = getCurrentWeekKey();
        if (state.weekKey !== currentWeekKey) {
          state.stats.weeklyCompletedTasks = 0;
          state.stats.weeklyTotalTasks = 0;
          state.stats.weeklyTokenEarnings = 0;
          state.weekKey = currentWeekKey;
        }
      },
    }
  )
);
