import { CampusAnalysis } from "./types";

export type TaskStatus = "PENDING" | "COMPLETED";

export type CampusTask = {
  id: string;
  title: string;
  deadline: string;
  priority: string;
  reason: string;
  status: TaskStatus;
  createdAt: string;
};

const STORAGE_KEY = "campuspilot_tasks";

export function getTasks(): CampusTask[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    return JSON.parse(stored) as CampusTask[];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: CampusTask[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function addTasksFromAnalysis(
  analysis: CampusAnalysis
): CampusTask[] {
  const existingTasks = getTasks();

  const newTasks: CampusTask[] = analysis.tasks.map(
    (task, index) => ({
      id: `${Date.now()}-${index}`,
      title: task.title,
      deadline: task.deadline || "",
      priority: task.priority,
      reason: task.reason,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    })
  );

  const updatedTasks = [
    ...existingTasks,
    ...newTasks,
  ];

  saveTasks(updatedTasks);

  return updatedTasks;
}

export function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): CampusTask[] {
  const tasks = getTasks();

  const updatedTasks = tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          status,
        }
      : task
  );

  saveTasks(updatedTasks);

  return updatedTasks;
}