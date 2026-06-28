# WakeRef

Référentiel wakeboard & wakeskate — [wakeref.app](https://wakeref.app)

![Preview of the website](/public/og-image.jpg)

## Stack

- **Frontend** : React 19 + Vite + React Router 7 (PWA installable)
- **Backend** : Supabase (PostgreSQL + Auth + Storage + Edge Functions) — pas d'API maison
- **Hébergement** : Vercel (SPA statique)

## Démarrage rapide

```bash
npm install
cp .env.example .env.local      # remplis VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev                     # http://localhost:5173
```

Base de données — dans le **SQL Editor** de Supabase, exécute `scripts/wakeref_post_restore.sql` (tables, vue, fonctions, RLS, bucket), puis crée le compte admin dans **Authentication → Users**.

```bash
npm run build                   # génère le sitemap + build Vite → dist/
```

> Détails complets (DB, restauration depuis backup, Edge Functions email, conventions) : voir le **[Development Guide](./docs/development-guide.md)**.

## Documentation

La documentation technique complète vit dans [`docs/`](./docs/) (point d'entrée : [`docs/index.md`](./docs/index.md)) :

| Doc | Contenu |
|-----|---------|
| [Project Overview](./docs/project-overview.md) | Vue d'ensemble & faits clés |
| [Architecture](./docs/architecture.md) | Pattern, stack, risques |
| [Source Tree](./docs/source-tree-analysis.md) | Arborescence annotée |
| [Data Models](./docs/data-models.md) | Schéma, RLS, vue `figures_full`, triggers |
| [API Contracts](./docs/api-contracts.md) | RPC, accès par rôle, Storage, Edge Functions |
| [Component Inventory](./docs/component-inventory.md) | Pages, composants, contexts, hooks, i18n |
| [Development Guide](./docs/development-guide.md) | Install, env, setup DB, conventions |
| [Deployment Guide](./docs/deployment-guide.md) | Vercel + Supabase, PWA, backups |
| [Saisie vocale & entraînement](./training/README.md) | Collecte de données (`/judge/voix`), fine-tuning Whisper, export ONNX → Hugging Face |

Instructions pour les agents IA : [`CLAUDE.md`](./CLAUDE.md).

## Licences

**Code** — MIT License, voir [LICENSE](./LICENSE)

**Contenu** (descriptions, conseils, données des figures) —
[Creative Commons Attribution-NonCommercial 4.0](https://creativecommons.org/licenses/by-nc/4.0/)
Libre d'utilisation à des fins non commerciales avec attribution.
