-- Échéance par todo (ex. "Dîner en famille" chaque mois sur 6 mois)
alter table public.goal_todos
  add column if not exists due_date date;

create index if not exists goal_todos_due_date_idx
  on public.goal_todos (user_id, due_date)
  where is_done = false;
