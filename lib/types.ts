export type CampusAnalysis = {
  summary: string;
  category: string;

  important_dates: {
    title: string;
    date: string;
    time?: string;
    location?: string;
  }[];

  tasks: {
    title: string;
    deadline?: string;
    priority: string;
    reason: string;
  }[];

  requirements: string[];

  warnings: string[];

  suggested_actions: {
    action: string;
    reason: string;
    requires_approval: boolean;
  }[];
};