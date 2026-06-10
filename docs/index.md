# WakeRef — Project Documentation Index

> Primary entry point for AI-assisted development. Generated 2026-06-11 via Deep Scan (BMAD document-project).

## Project Overview

- **Type:** Monolith — client-rendered React SPA over a Backend-as-a-Service (Supabase)
- **Primary Language:** JavaScript / JSX (ESM, no TypeScript)
- **Architecture:** Layered SPA with **no API layer** — RLS + `figures_full` view + RPCs are the contract
- **Hosting:** Vercel (static SPA) + Supabase (Postgres / Auth / Storage / Edge Functions)

## Quick Reference

- **Tech Stack:** React 19 · Vite 8 · react-router-dom 7 · Supabase JS 2 · CSS Modules · vite-plugin-pwa
- **Entry Point:** `index.html` → `src/main.jsx` → `src/App.jsx`
- **Data client:** `src/lib/supabase.js` (singleton; components query Supabase directly)
- **Read model:** `figures_full` view · **DB setup:** `scripts/wakeref_post_restore.sql`
- **Routes:** public (`/`, `/figures`, `/figures/:slug`, `/quiz`, `/compo`, `/contact`, `/submit`) + admin (`/admin/*`, auth-guarded, code-split)

## Generated Documentation

- [Project Overview](./project-overview.md)
- [Architecture](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Data Models](./data-models.md)
- [API Contracts](./api-contracts.md)
- [Component & Page Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)

## Existing Documentation

- [README.md](../README.md) — setup, Supabase init, Edge Functions, Vercel deploy (FR)
- [CLAUDE.md](../CLAUDE.md) — AI working instructions for this repo

## Getting Started

```bash
npm install
cp .env.example .env.local   # add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev                  # http://localhost:5173
```
DB from scratch: run `scripts/wakeref_post_restore.sql` in the Supabase SQL Editor, then create the admin user in Authentication → Users. Full details in the [Development Guide](./development-guide.md).

## Notes & caveats

- **No tests / no linter** configured — verification is manual.
- **Schema is hand-managed** across `scripts/wakeref_post_restore.sql` (executable) and `scripts/wakeref_schema.sql` (reference dump); no migration tool.
- **Build queries Supabase** (sitemap generation) — needs valid env vars + a reachable project.
- Targets the Supabase **free plan** — avoid paid-only features.
