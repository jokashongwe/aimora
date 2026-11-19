# Aimora

PWA de suivi d’objectifs (Next.js + Tailwind + Supabase).

## Fonctionnalités

- Objectifs par catégorie (Famille, Travail, Étude, Santé, Finances, Personnel)
- Périodes : hebdomadaire, mensuelle, semestrielle
- Todos par objectif (cocher = progression auto jusqu’à validation)
- Check-ins de progression + publication des réussites
- Partage d’objectifs entre utilisateurs
- Rappels matinaux Web Push (messages motivationnels ~07h selon le fuseau du profil)

## Prérequis

1. Un projet Supabase existant
2. Node.js 20+

## Setup

### 1. Variables d’environnement

Copie `.env.example` vers `.env.local` (déjà prérempli pour les clés VAPID) et renseigne :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Les clés VAPID et `CRON_SECRET` sont déjà générées dans `.env.local`.

### 2. Schéma SQL

Dans le SQL Editor Supabase, exécute dans l’ordre :

1. [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql)
2. [`supabase/migrations/002_goal_todos.sql`](supabase/migrations/002_goal_todos.sql) (todos + sync progression)

Cela crée les tables, RLS, trigger profil, catégories système et messages motivationnels.

### 3. Auth Supabase

Dans Authentication → Providers, active **Email**.  
(Optionnel) désactive la confirmation email en local pour tester plus vite.

### 4. Lancer l’app

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

### 5. PWA & notifications

- En production (`npm run build && npm start`), le service worker est actif.
- En développement, le SW PWA est désactivé ; les push peuvent nécessiter un build.
- Active les notifications dans **Réglages** (HTTPS ou localhost requis).

### 6. Cron matinal

`vercel.json` appelle chaque heure `/api/cron/morning-reminders`.  
L’API n’envoie que si l’heure locale du profil est entre 07:00 et 08:00.

Header requis :

```http
Authorization: Bearer <CRON_SECRET>
```

## Scripts

| Commande        | Description        |
|-----------------|--------------------|
| `npm run dev`   | Dev server         |
| `npm run build` | Build production   |
| `npm start`     | Serveur production |
| `npm run lint`  | ESLint             |

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Supabase Auth / Postgres / RLS
- `@ducanh2912/next-pwa` + Web Push (`web-push`)
