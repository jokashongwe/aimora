-- Todos liés aux objectifs (progression auto)
create table if not exists public.goal_todos (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goal_todos_goal_id_idx on public.goal_todos (goal_id);

drop trigger if exists goal_todos_set_updated_at on public.goal_todos;
create trigger goal_todos_set_updated_at
before update on public.goal_todos
for each row execute function public.set_updated_at();

-- Recalcule la progression de l'objectif à partir des todos
create or replace function public.sync_goal_progress_from_todos(p_goal_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  total_count integer;
  done_count integer;
  new_progress integer;
  new_status text;
begin
  select count(*), count(*) filter (where is_done)
  into total_count, done_count
  from public.goal_todos
  where goal_id = p_goal_id;

  if total_count = 0 then
    return;
  end if;

  new_progress := round((done_count::numeric / total_count::numeric) * 100)::integer;
  new_status := case when new_progress >= 100 then 'completed' else 'active' end;

  update public.goals
  set
    progress = new_progress,
    status = case
      when status = 'abandoned' then status
      else new_status
    end,
    updated_at = now()
  where id = p_goal_id;
end;
$$;

create or replace function public.trg_goal_todos_sync_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_goal uuid;
begin
  target_goal := coalesce(new.goal_id, old.goal_id);
  perform public.sync_goal_progress_from_todos(target_goal);
  return coalesce(new, old);
end;
$$;

drop trigger if exists goal_todos_sync_progress on public.goal_todos;
create trigger goal_todos_sync_progress
after insert or update or delete on public.goal_todos
for each row execute function public.trg_goal_todos_sync_progress();

alter table public.goal_todos enable row level security;

create policy "Users can read todos for accessible goals"
  on public.goal_todos for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.goals g
      where g.id = goal_todos.goal_id
        and (
          g.user_id = auth.uid()
          or g.visibility = 'public_achievement'
          or exists (
            select 1 from public.goal_shares s
            where s.goal_id = g.id and s.shared_with_id = auth.uid()
          )
        )
    )
  );

create policy "Owners can insert todos"
  on public.goal_todos for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.goals g
      where g.id = goal_id and g.user_id = auth.uid()
    )
  );

create policy "Owners can update todos"
  on public.goal_todos for update to authenticated
  using (
    exists (
      select 1 from public.goals g
      where g.id = goal_todos.goal_id and g.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.goals g
      where g.id = goal_todos.goal_id and g.user_id = auth.uid()
    )
  );

create policy "Owners can delete todos"
  on public.goal_todos for delete to authenticated
  using (
    exists (
      select 1 from public.goals g
      where g.id = goal_todos.goal_id and g.user_id = auth.uid()
    )
  );
