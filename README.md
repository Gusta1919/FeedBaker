# FeedBaker

**Visual poll app — scroll, vote, decide.**

Can't decide between two outfits, logos, or holiday spots? FeedBaker turns the question into a photo poll. You post up to four pictures, and other people settle it with a single tap while they scroll a TikTok-style feed. It's a full-stack project: a native mobile app and a web app, both running on one shared Supabase backend.

![Expo](https://img.shields.io/badge/Expo-57-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=black)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## Features

- **Swipeable photo polls** — a full-screen, TikTok-style feed. Each poll has up to 4 photo options; tap one to vote, or skip.
- **Categories** — browse the *Explore* tab and pick a category; your feed updates instantly.
- **Create your own polls** — upload photos, write a question, and choose who can see it:
  - **Visibility:** public, unlisted (link only), or private (invite code)
  - **Results:** live for everyone, voters only, creator only, after N votes, or never
  - **Expiry:** optional end date
- **Personal stats** — see how many polls you've voted on and created, plus an **originality score**: how often you vote *against* the crowd (from "Crowd favorite" to "Full contrarian").
- **Secure by default** — every table is protected by Postgres Row Level Security, so users can only read and change what they're allowed to.

## Tech stack

| Layer | Tech |
|-------|------|
| **Mobile app** (`mobile/`) | Expo 57, React Native, expo-router, Reanimated, TypeScript |
| **Web app** (`web/`) | Next.js 15 (App Router, Server Actions), Tailwind CSS 4, Zod |
| **Backend** (`supabase/`) | Supabase — PostgreSQL, Auth, Storage, Row Level Security, SQL functions (RPCs) |

This repo has **two clients** sharing one **Supabase** backend:

| Folder | What it is |
|--------|------------|
| **`mobile/`** | Native app (Expo / React Native) — active development |
| **`web/`** | Browser app (Next.js) — archived, fully working |
| **`supabase/`** | Database schema, auth, migrations (shared) |

---

## Getting started

### Prerequisites

- **Node.js** 20+
- **Docker Desktop** (runs the local Supabase backend)
- **Xcode** with an iOS Simulator (for the mobile app on Mac) — open Xcode once, accept the license, then **Xcode → Settings → Platforms** → install a simulator (e.g. iPhone 16)

### 1. Start the backend (Supabase)

From the project root:

```bash
cd web
npm install
npm run db:start    # first run pulls Docker images (~5 min)
```

Set up environment files (the keys are printed by `npm run db:status`):

```bash
cp web/.env.example web/.env.local
cp mobile/.env.example mobile/.env
```

Seed demo polls (optional):

```bash
cd web && npm run seed
```

### 2. Run the mobile app

```bash
cd mobile
npm install
npm run ios
```

This starts **Expo** and opens the app in the **iOS Simulator**.

```bash
npm run start          # Expo dev menu — press i for iOS, a for Android
npm run android        # Android emulator (needs Android Studio)
npm run test:carousel  # unit tests for the swipe carousel
```

**Logging in:** the *For you* feed works without an account (voting asks you to sign in). *My polls* and *Stats* require sign-in. For local dev, enable Email + Password in Supabase Auth and create a test user in Supabase Studio at http://127.0.0.1:54323.

### 3. Run the web app (optional)

```bash
cd web
npm run dev
```

Open http://localhost:3000.

---

## Project structure

```
FeedBaker/
├── supabase/
│   └── migrations/    # Database schema, RLS policies, SQL functions
├── web/               # Next.js browser version
│   ├── src/
│   └── scripts/       # Seed + reset scripts
└── mobile/            # Expo React Native app
    ├── app/           # Screens (expo-router file-based routing)
    ├── components/    # Feed, poll cards, carousel, category grid
    ├── context/       # Auth + category state
    └── lib/           # Supabase client, API calls, carousel logic + tests
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Can't reach Supabase | Keep `npm run db:start` running. The iOS Simulator uses `127.0.0.1`, same as your Mac |
| Android emulator | Use `10.0.2.2` instead of `127.0.0.1` in `mobile/.env` (handled automatically in code) |
| Expo cache weirdness | `cd mobile && npx expo start -c` |
| Simulator not opening | Run `open -a Simulator`, then press `i` in the Expo terminal |

## Roadmap

- App Store / Play Store release via **EAS Build** (`eas build --platform ios`)

## License

[MIT](LICENSE) © Gustaw Smetek
