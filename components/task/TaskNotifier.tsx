"use client";
import { useTasks } from "@/lib/tasks-context";
import { taskReminderDateTime } from "@/lib/task-status";
import { useNotificationPolling } from "@/lib/use-notification-polling";

/** Invia una notifica del browser al momento dell'avviso anticipato scelto per una Task. */
export function TaskNotifier() {
  const { tasks, updateTask } = useTasks();

  useNotificationPolling(() => {
    const now = new Date();
    tasks.forEach((t) => {
      if (t.completed || t.reminded || t.reminderOffset === "none") return;
      const remindAt = taskReminderDateTime(t);
      if (!remindAt) return;
      const diff = (now.getTime() - remindAt.getTime()) / 60000;
      if (diff >= 0 && diff < 2) {
        new Notification(t.title, { body: "Controlla il countdown nella Home" });
        updateTask(t.id, { reminded: true });
      }
    });
  });

  return null;
}
