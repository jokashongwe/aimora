-- "Passer cette étape" : une étape passée sort du calcul de progression
alter table public.goal_todos
  add column if not exists is_skipped boolean not null default false;

-- Une étape ne peut pas être à la fois faite et passée
alter table public.goal_todos
  drop constraint if exists goal_todos_done_xor_skipped;
alter table public.goal_todos
  add constraint goal_todos_done_xor_skipped check (not (is_done and is_skipped));

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
  -- Les étapes passées ne comptent ni au numérateur ni au dénominateur
  select
    count(*) filter (where not is_skipped),
    count(*) filter (where is_done and not is_skipped)
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
