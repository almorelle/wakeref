# WakeRef

Référentiel wakeboard & wakeskate

![Preview of the website](/public/og-image.jpg)

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

**Option A — Restaurer depuis un backup** (recommandé) :
```bash
psql "$SUPABASE_DB_URL" < backup_YYYY-MM-DD.sql
psql "$SUPABASE_DB_URL" < scripts/wakeref_post_restore.sql
```

**Option B — Partir de zéro** :

Dans l'**SQL Editor** de Supabase, exécute `scripts/wakeref_post_restore.sql` — crée les tables, vues, fonctions, policies, bucket. Puis recrée le compte admin manuellement (voir étape 4).

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
assets/                  # logos
public/                  # ressources publiques
scripts/                 # génération sitemap, wakeref_post_restore.sql, wakeref_schema.sql
src/                     # Composants
├── components/          # Composants partagés (FigureCard, Navbar, Badges…)
├── hooks/               # useAuth, useToast
├── lib/                 # supabase.js (client)
├── pages/               # Page d'accueil + pages admin
├── App.jsx              # Router principal
├── main.jsx
└── index.css            # Design system global
supabase/
└── functions/           # Fonctions Supabase
```

## Notifications email

Une Edge Function Supabase envoie un email à chaque nouvelle soumission de vidéo ou via le contact form.

### 1. Déployer les fonctions

```bash
npx supabase functions deploy notify-video-submission --project-ref <project-ref>
npx supabase functions deploy send-contact --project-ref <project-ref>
```

### 2. Configurer les secrets

```bash
npx supabase secrets set RESEND_API_KEY=re_... NOTIFY_EMAIL=ton@email.com --project-ref <project-ref>
```

### 3. Créer le webhook pour la soumission vidéo

Dans Supabase Dashboard → **Database → Webhooks → Create a new hook** :
- Table : `video_submissions`
- Événement : `INSERT`
- Type : **Supabase Edge Functions**
- Fonction : `notify-video-submission`

---

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