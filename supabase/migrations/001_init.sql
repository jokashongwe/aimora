-- Airoma initial schema
create extension if not exists "pgcrypto";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  timezone text not null default 'Africa/Kinshasa',
  notifications_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Categories (system + custom)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  icon text,
  user_id uuid references auth.users (id) on delete cascade,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (slug, user_id)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  title text not null,
  description text,
  period text not null check (period in ('weekly', 'monthly', 'semester')),
  start_date date not null default current_date,
  end_date date,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  visibility text not null default 'private' check (visibility in ('private', 'shared', 'public_achievement')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_checkins (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  progress integer not null check (progress >= 0 and progress <= 100),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.goal_shares (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  shared_with_id uuid not null references auth.users (id) on delete cascade,
  can_comment boolean not null default true,
  created_at timestamptz not null default now(),
  unique (goal_id, shared_with_id)
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  message text,
  progress integer not null default 100,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.motivation_messages (
  id uuid primary key default gen_random_uuid(),
  period text not null check (period in ('morning', 'weekly', 'monthly', 'semester')),
  message text not null,
  locale text not null default 'fr',
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists goals_user_id_idx on public.goals (user_id);
create index if not exists goals_category_id_idx on public.goals (category_id);
create index if not exists goal_shares_shared_with_idx on public.goal_shares (shared_with_id);
create index if not exists achievements_public_idx on public.achievements (is_public, created_at desc);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- Updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Utilisateur')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create unique index if not exists categories_system_slug_uidx
  on public.categories (slug)
  where is_system = true;

-- Seed system categories
insert into public.categories (name, slug, icon, is_system)
select v.name, v.slug, v.icon, true
from (
  values
    ('Famille', 'famille', 'family'),
    ('Travail', 'travail', 'work'),
    ('Étude', 'etude', 'study'),
    ('Santé', 'sante', 'health'),
    ('Finances', 'finances', 'finance'),
    ('Personnel', 'personnel', 'personal')
) as v(name, slug, icon)
where not exists (
  select 1 from public.categories c where c.slug = v.slug and c.is_system = true
);

-- Seed motivation messages (FR)
insert into public.motivation_messages (period, message, locale) values
  ('morning', 'Bonjour ! Une nouvelle journée pour avancer sur tes objectifs. Un petit pas compte déjà.', 'fr'),
  ('morning', 'Le matin est le meilleur allié de ta discipline. Choisis un objectif et avance.', 'fr'),
  ('morning', 'Tu n''as pas besoin d''être parfait·e — juste présent·e. C''est ton moment.', 'fr'),
  ('morning', 'Tes objectifs t''attendent. Aujourd''hui, fais un geste concret vers eux.', 'fr'),
  ('morning', 'La constance bat le talent. Commence léger, mais commence maintenant.', 'fr'),
  ('weekly', 'Rappel hebdomadaire : regarde tes objectifs de la semaine et ajuste le tir.', 'fr'),
  ('weekly', 'Une semaine, c''est sept chances de progresser. Laquelle saisis-tu aujourd''hui ?', 'fr'),
  ('weekly', 'Tes objectifs hebdomadaires méritent ton attention. Un check-in rapide ?', 'fr'),
  ('monthly', 'Rappel mensuel : où en es-tu sur tes objectifs du mois ? Chaque % compte.', 'fr'),
  ('monthly', 'Le mois avance — et toi aussi. Mets à jour ta progression pour rester lucide.', 'fr'),
  ('monthly', 'Les grands résultats naissent des efforts réguliers. Ton objectif mensuel t''appelle.', 'fr'),
  ('semester', 'Objectif semestriel : prends de la hauteur. Quelle est ta prochaine étape clé ?', 'fr'),
  ('semester', 'Les ambitions longues se construisent jour après jour. Ne lâche rien.', 'fr'),
  ('semester', 'Semestre en cours : célèbre le chemin parcouru et clarifie la suite.', 'fr');

-- RLS
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.goals enable row level security;
alter table public.goal_checkins enable row level security;
alter table public.goal_shares enable row level security;
alter table public.achievements enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.motivation_messages enable row level security;

-- Profiles policies
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Categories
create policy "Anyone authenticated can read system and own categories"
  on public.categories for select to authenticated
  using (is_system = true or user_id = auth.uid());

create policy "Users can create own categories"
  on public.categories for insert to authenticated
  with check (user_id = auth.uid() and is_system = false);

create policy "Users can update own categories"
  on public.categories for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own categories"
  on public.categories for delete to authenticated
  using (user_id = auth.uid() and is_system = false);

-- Goals
create policy "Users can read own goals"
  on public.goals for select to authenticated
  using (
    user_id = auth.uid()
    or visibility = 'public_achievement'
    or exists (
      select 1 from public.goal_shares s
      where s.goal_id = goals.id and s.shared_with_id = auth.uid()
    )
  );

create policy "Users can insert own goals"
  on public.goals for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own goals"
  on public.goals for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own goals"
  on public.goals for delete to authenticated
  using (user_id = auth.uid());

-- Checkins
create policy "Users can read checkins for accessible goals"
  on public.goal_checkins for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.goals g
      where g.id = goal_checkins.goal_id
        and (
          g.user_id = auth.uid()
          or exists (
            select 1 from public.goal_shares s
            where s.goal_id = g.id and s.shared_with_id = auth.uid()
          )
        )
    )
  );

create policy "Users can insert own checkins"
  on public.goal_checkins for insert to authenticated
  with check (user_id = auth.uid());

-- Shares
create policy "Owners and recipients can read shares"
  on public.goal_shares for select to authenticated
  using (owner_id = auth.uid() or shared_with_id = auth.uid());

create policy "Owners can create shares"
  on public.goal_shares for insert to authenticated
  with check (owner_id = auth.uid());

create policy "Owners can delete shares"
  on public.goal_shares for delete to authenticated
  using (owner_id = auth.uid());

-- Achievements
create policy "Public achievements readable by authenticated"
  on public.achievements for select to authenticated
  using (is_public = true or user_id = auth.uid());

create policy "Users can insert own achievements"
  on public.achievements for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete own achievements"
  on public.achievements for delete to authenticated
  using (user_id = auth.uid());

-- Push subscriptions
create policy "Users manage own push subscriptions"
  on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Motivation messages readable by all authenticated
create policy "Motivation messages are readable"
  on public.motivation_messages for select to authenticated
  using (true);
