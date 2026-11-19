-- Heure du rappel choisie par l'utilisateur (heure locale, selon son fuseau)
alter table public.profiles
  add column if not exists reminder_hour smallint not null default 7
    check (reminder_hour between 0 and 23);

-- Dernier jour (date locale) où le rappel a été envoyé : évite les doublons
-- quand le cron passe plusieurs fois et permet un rattrapage si une exécution est manquée.
alter table public.profiles
  add column if not exists last_reminder_on date;
