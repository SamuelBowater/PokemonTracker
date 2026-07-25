# Pokémon Card Tracker

Track which cards you own across the Mega Evolution series (Perfect Order, Chaos Rising, Pitch Black), with images pulled from [TCGdex](https://tcgdex.dev/). Owned/needed status is stored in Supabase so it syncs across devices.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier).
2. In the Supabase SQL editor, run the contents of [`supabase/schema.sql`](supabase/schema.sql).
3. In Supabase project settings → API, copy the **Project URL** and **anon public key**.
4. Copy `.env.local.example` to `.env.local` and fill in those two values:
   ```bash
   cp .env.local.example .env.local
   ```
5. Install dependencies and run locally:
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000.

## Deploying

Push this repo to GitHub and import it in [Vercel](https://vercel.com/new). Add the same two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project settings, then deploy.

On your phone, open the deployed URL and use "Add to Home Screen" for quick access.

## Adding more sets

Add an entry to `TRACKED_SETS` in [`lib/sets.ts`](lib/sets.ts) with the TCGdex set id (e.g. `me06`) and display name.
