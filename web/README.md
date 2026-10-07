# Feedbacker

TikTok-style web app for photo polls. Scroll, vote, decide.

## Stack

- **Next.js 15** (App Router, Server Actions)
- **Supabase** (Auth, PostgreSQL, Storage, RLS)
- **Tailwind CSS 4**

## Local setup

### 1. Prerequisites

- Node.js 20+
- Docker Desktop (for local Supabase)

### 2. Install & start Supabase

```bash
cd ~/Projects/Feedbacker
npm install
npm run db:start    # first run pulls Docker images (~5 min)
```

### 3. Environment

`.env.local` is already configured for local Supabase. For cloud deploy, copy `.env.example` and fill in your Supabase project keys.

### 4. Seed demo data

```bash
npm run seed
```

Creates 8 demo creators, 30 extra voter accounts (so polls carry realistic
vote counts) and 40 sample polls across every category and privacy setting.
Use `npm run seed:force` to wipe and re-seed.

Log in as `demo@feedbacker.local` to see the app as an established user.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Log in locally

**Email & password:**

1. Go to `/login`
2. Sign up with any email + password (min 6 characters), or use a demo account:
   - Email: `demo@feedbacker.local`
   - Password: `demo123456`
3. Run `npm run seed` if demo accounts don't exist yet — it sets passwords on all seeded users.

**Google / Apple:** buttons are on the login page; OAuth will be wired up when you deploy.

**OAuth (Google/Apple):** configure providers in Supabase Dashboard + redirect URLs when you're ready for production.

## App routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Auth (email/password; Google & Apple coming soon) |
| `/feed` | Main vertical scroll feed (open to visitors; voting needs an account) |
| `/create` | Create poll — 2–4 photos, privacy settings |
| `/profile` | Your polls & stats |
| `/p/[id]` | Single poll (shareable link) |
| `/p/[id]/stats` | Creator analytics |

## Features

- Vertical scroll-snap feed with auto-advance after each vote
- 2–4 photo options per poll, laid out on a square grid at every count
- Tap to vote, animated percentage reveal, and an "you're with N% of voters" result
- Results are held back until you vote, so the crowd can't sway your pick
- Privacy controls: feed visibility (public / link-only / invite-only) and a
  results policy (live, after voting, after N votes, creator only, never)
- Streak and daily vote counters to bring people back
- Client-side image compression before upload, with a server-side retry
- Keyboard support on desktop: `1`–`4` to vote, `↑`/`↓` (or `j`/`k`) to move
- Category filters, shareable links, and creator analytics per poll
- Row Level Security on every table

## Useful commands

```bash
npm run dev          # Start Next.js
npm run typecheck    # TypeScript only (safe while dev is running)
npm run build        # Production build — shares .next, so restart dev afterwards
npm run db:start     # Start local Supabase
npm run db:stop      # Stop local Supabase
npm run db:reset     # Reset DB + reapply migrations
npm run db:status    # Show URLs and keys
npm run seed         # Seed demo polls
```

## Supabase Studio

Local admin UI: [http://127.0.0.1:54323](http://127.0.0.1:54323)

## Deploy to cloud (later)

1. Create project at [supabase.com](https://supabase.com)
2. Run migrations: `npx supabase db push`
3. Set env vars on Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. Configure OAuth redirect: `https://yourdomain.com/auth/callback`
5. Deploy to Vercel: `vercel deploy`

## Poll limits

- **2–4 options** per poll (photos)
- **1 vote** per user per poll
- Question max **200 characters**
