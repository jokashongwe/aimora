-- Nombre de fois qu'une étape a été reportée (échéance repoussée)
alter table public.goal_todos
  add column if not exists postponed_count smallint not null default 0
    check (postponed_count >= 0);
