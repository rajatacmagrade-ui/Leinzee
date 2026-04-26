import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { differenceInHours, differenceInMinutes, parseISO } from 'date-fns';

export default function NotificationManager() {
  const tasks = useStore(state => state.tasks);
  const notifications = useStore(state => state.notifications);
  const addNotification = (title: string, message: string, type: 'deadline' | 'pending' | 'reward') => {
    // Basic check to avoid notification spam
    const exists = notifications.some(n => n.message === message && 
      differenceInMinutes(new Date(), parseISO(n.createdAt)) < 60
    );
    if (exists) return;

    useStore.setState((state) => ({
      notifications: [
        {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
          type,
          title,
          message,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    }));
  };

  const lastCheck = useRef<number>(0);

  useEffect(() => {
    const checkTasks = () => {
      const now = new Date();
      if (now.getTime() - lastCheck.current < 60000) return; // Check once per minute
      lastCheck.current = now.getTime();

      const pendingTasks = tasks.filter(t => t.status === 'pending');

      pendingTasks.forEach(task => {
        const deadline = parseISO(task.deadline);
        const hoursLeft = differenceInHours(deadline, now);
        
        // Reminder for high priority tasks
        if (task.priority === 'high') {
          addNotification(
            '🔥 Priority Focus',
            `Focus on completing: "${task.title}". This is high priority!`,
            'pending'
          );
        }

        // Deadline approaching reminders
        if (hoursLeft <= 24 && hoursLeft > 0) {
          addNotification(
            '⏰ Deadline Approaching',
            `"${task.title}" is due in ${hoursLeft} hours.`,
            'deadline'
          );
        } else if (hoursLeft <= 0) {
          addNotification(
            '⚠️ Task Overdue',
            `"${task.title}" was due! Please complete it ASAP.`,
            'deadline'
          );
        }
      });
    };

    const interval = setInterval(checkTasks, 60000);
    checkTasks(); // Initial check

    return () => clearInterval(interval);
  }, [tasks, notifications]);

  return null;
}
