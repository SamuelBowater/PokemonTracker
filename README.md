# Pokémon Card Tracker

Track which cards you own across the Mega Evolution series (Perfect Order, Chaos Rising, Pitch Black), with images pulled from [TCGdex](https://tcgdex.dev/). Built for mastersetting — each card's normal/reverse/holo/1st-edition variants are tracked individually. Owned/needed status is stored in a Neon Postgres database (via Vercel's Neon integration) so it syncs across devices.

## Setup

1. **Deploy this repo to Vercel** (push to GitHub, then [import it](https://vercel.com/new)).
2. In the Vercel project, go to **Storage → Create Database → Neon** (or **Integrations → Neon**) to provision a Postgres database and automatically wire up the `DATABASE_URL` environment variable.
3. Open the Neon database's SQL editor (linked from the Vercel Storage tab, or via [neon.tech](https://neon.tech)) and run the contents of [`db/schema.sql`](db/schema.sql).
4. For local development, pull the env vars Vercel just set:
   ```bash
   npm install -g vercel   # if you don't have it
   vercel link
   vercel env pull .env.local
   ```
   This writes `DATABASE_URL` into `.env.local` for you. (See `.env.local.example` for the expected format if you'd rather set it manually.)
5. Install dependencies and run locally:
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000.

## Deploying

Once `DATABASE_URL` is set in the Vercel project (step 2 above), just push to your connected branch — Vercel builds and deploys automatically.

On your phone, open the deployed URL and use "Add to Home Screen" for quick access.

## Adding more sets

Add an entry to `TRACKED_SETS` in [`lib/sets.ts`](lib/sets.ts) with the TCGdex set id (e.g. `me06`) and display name.

## Upgrading an existing database for variant tracking

If you set up the database before masterset (variant) tracking was added, run [`db/migrations/001_add_variants.sql`](db/migrations/001_add_variants.sql) once in the Neon SQL editor to add the `variant` column to `owned_cards`. Any cards already marked owned will carry over as their "normal" variant.
