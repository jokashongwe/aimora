export type GoalPeriod = "weekly" | "monthly" | "semester";
export type GoalStatus = "active" | "completed" | "abandoned";
export type GoalVisibility = "private" | "shared" | "public_achievement";
export type MotivationPeriod = "morning" | "weekly" | "monthly" | "semester";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  timezone: string;
  notifications_enabled: boolean;
  reminder_hour: number;
  last_reminder_on: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  user_id: string | null;
  is_system: boolean;
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string | null;
  period: GoalPeriod;
  start_date: string;
  end_date: string | null;
  progress: number;
  status: GoalStatus;
  visibility: GoalVisibility;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
  goal_todos?: GoalTodoSummary[] | null;
};

export type GoalTodoSummary = {
  id: string;
  title: string;
  is_done: boolean;
  is_skipped: boolean;
  due_date: string | null;
  position: number;
};

export type GoalCheckin = {
  id: string;
  goal_id: string;
  user_id: string;
  progress: number;
  note: string | null;
  created_at: string;
};

export type GoalTodo = {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  is_done: boolean;
  is_skipped: boolean;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type GoalShare = {
  id: string;
  goal_id: string;
  owner_id: string;
  shared_with_id: string;
  can_comment: boolean;
  created_at: string;
  goals?: Goal | null;
  owner?: Profile | null;
  shared_with?: Profile | null;
};

export type Achievement = {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  message: string | null;
  progress: number;
  is_public: boolean;
  created_at: string;
  profiles?: Profile | null;
};

export const PERIOD_LABELS: Record<GoalPeriod, string> = {
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  semester: "Semestriel",
};

export const STATUS_LABELS: Record<GoalStatus, string> = {
  active: "Actif",
  completed: "Terminé",
  abandoned: "Abandonné",
};