# WakeRef

Référentiel wakeboard & wakeskate

![Screenshot of the preview of the website](/assets/images/preview.png)

## Stack

- **Frontend** : React 18 + Vite + React Router 6
- **Backend** : Supabase (PostgreSQL + Auth + Storage)
- **PWA** : vite-plugin-pwa (installable sur mobile)

## Installation

### 1. Cloner / dézipper le projet

```bash
cd wakeref
npm install
```

### 2. Configurer Supabase

Copie `.env.example` en `.env.local` et remplis tes valeurs :

```bash
cp .env.example .env.local
```

Dans `.env.local` :
```
VITE_SUPABASE_URL=https://TON_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxx
```

Ces valeurs se trouvent dans ton dashboard Supabase → **Settings → API Keys**.

### 3. Initialiser la base de données

Dans l'**SQL Editor** de Supabase, exécute dans l'ordre :
1. `init/wakeref_schema.sql` — crée les tables, vues, fonctions, policies
2. `init/dataset_01..à..12_category.sql` — rempli la base de données avec le jeu de données de base.

### 4. Créer ton compte admin

Dans Supabase → **Authentication → Users → Add user** :
- Email : ton email
- Password : ton mot de passe

Ce compte sera le seul à pouvoir créer/modifier/supprimer des figures et uploader des vidéos.

### 5. Lancer en développement

```bash
npm run dev
```

L'app tourne sur http://localhost:5173

### 6. Build pour la production

```bash
npm run build
```

Le dossier `dist/` est prêt à déployer sur **Vercel**, **Netlify**, ou tout hébergeur statique.

---

## Structure du projet

```
src/
├── components/          # Composants partagés (FigureCard, Navbar, Badges…)
├── hooks/               # useAuth, useToast
├── lib/                 # supabase.js (client)
├── pages/
│   ├── Home.jsx         # Page d'accueil + recherche
│   ├── Figures.jsx      # Liste filtrée
│   ├── FigureDetail.jsx # Fiche détaillée + vidéos + takedown
│   ├── Quiz.jsx         # Mode quiz
│   └── admin/
│       ├── Login.jsx
│       ├── AdminLayout.jsx   # Guard auth + sidebar
│       ├── AdminDashboard.jsx
│       ├── AdminFigures.jsx  # Liste + suppression
│       ├── FigureForm.jsx    # Création / édition
│       ├── AdminVideos.jsx   # Upload vidéos
│       └── AdminTakedowns.jsx
├── App.jsx              # Router principal
├── main.jsx
└── index.css            # Design system global
```

## Routes

| Route | Description |
|---|---|
| `/` | Accueil, recherche, catégories |
| `/figures` | Liste avec filtre par catégorie |
| `/figures/:slug` | Fiche détaillée |
| `/quiz` | Mode quiz |
| `/admin/login` | Connexion admin |
| `/admin` | Dashboard |
| `/admin/figures` | Gestion des figures |
| `/admin/figures/new` | Créer une figure |
| `/admin/figures/:id/edit` | Modifier une figure |
| `/admin/videos` | Upload et gestion vidéos |
| `/admin/takedowns` | Demandes de retrait |

## Déploiement Vercel

```bash
npm i -g vercel
vercel
```

Ajoute les variables d'environnement dans le dashboard Vercel :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Licences

**Code** — MIT License, voir [LICENSE](./LICENSE)

**Contenu** (descriptions, conseils, données des figures) —
[Creative Commons Attribution-NonCommercial 4.0](https://creativecommons.org/licenses/by-nc/4.0/)
Libre d'utilisation à des fins non commerciales avec attribution.