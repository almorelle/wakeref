# Architecture WakeRef — vue d'ensemble

Trois schémas : le site existant, le module compétition (conçu), et l'input voix.
Rendu Mermaid (IntelliJ / GitHub). Version ASCII : voir aussi le fil de discussion.

---

## 1. Site existant (live)

```mermaid
graph TD
  App["WakeRef PWA — React 19 + Vite + Vercel"]
  App --> Pub["Routes publiques (Navbar)"]
  App --> Adm["Routes admin (auth)"]
  App --> Labo["Routes cachées / labo"]
  App --> Data["src/lib/supabase.js — client unique"]
  Pub --> R1["/ · /figures · /figures/:slug · /quiz · /contact"]
  Pub --> R2["/compo — calculatrice de note /20 (grilles)"]
  Pub --> R3["/composition-simple (ex /competition)"]
  Adm --> R4["/admin — figures · videos · takedowns · judge runs"]
  Labo --> R5["/judge — entraînement au jugement"]
  Labo --> R6["/judge/voix — LABO input voix"]
  Data --> SB["Supabase — Postgres · Auth · Storage"]
  SB --> T["figures · categories · prerequisites · videos · compositions · takedown_requests"]
```

---

## 2. Module compétition (conçu, pas encore codé en React)

```mermaid
graph TD
  Par["PARCOURS — short code, partageable (objet pivot)"]
  Par --> Setup["1. SETUP parcours — sections · slots intérieur/extérieur · zones air"]
  Par --> Pou["POULES"]
  Pou --> Run["RUNS (— entrées)"]
  Run --> Sai["2. SAISIE de run — squelette guidé par le parcours"]
  Pou --> Mat["3. MATRICE de poule — lignes = sections · colonnes = riders"]
  Sai -. "input" .-> Voix["Couche voix (diagramme 3)"]
  Setup -.- Proto["protos : judge-run-saisie.html · competition-module.html"]
```

---

## 3. Input voix (labo /judge/voix ; alimentera la saisie compèt)

```mermaid
graph TD
  Mic["🎤 Micro"] --> Q{"Quoi ?"}

  Q -->|"Trick isolé (air/kicker/flat)"| M1["Modèle MAISON — whisper fine-tuné, classifieur 221 tricks"]
  M1 --> Mch["matcher voiceMatch + aliases"]
  Mch --> Chip["chip validé"]

  Q -->|"Passe JIB (compositionnelle)"| WS["whisper-small (générique)"]
  WS --> Gr["grammaire contrainte — LogitsProcessor, STRUCTURE seule"]
  Gr --> Cp["composeur normalizeJib — atomes + fuzzy + slots"]
  Cp --> Tx["texte propre"]
  Cp --> Hole["noms de tricks DANS la passe = TROU"]
  Hole --> FT["FINE-TUNE JIB (à venir) — même technique que le fine-tune tricks, dataset = passes entières (audio + correction). Couvre chaque ATOME → généralise les combinaisons jamais entendues (compositionnel, pas un QCM)"]

  Voc[("VOCAB partagé — atomes jib + 74 tricks kicker + aliases")]
  Voc -.-> Mch
  Voc -.-> Gr
  Voc -.-> Cp
  Voc -.-> FT
```

---

**Fils conducteurs**

- **2 couches** : (1) *comment tu juges* = module compétition ; (2) *comment tu captes* = input voix. La saisie du module **consomme** l'input voix.
- **2 modèles voix**, **même technique de fine-tune** (whisper séquence-à-séquence), **datasets différents** : le **maison** (sur whisper-base) n'a vu que des tricks isolés → se comporte *de facto* comme un classifieur mono-trick (air/kicker/flat) ; le **jib** (à venir, sur whisper-small) verra des passes entières → transcripteur compositionnel. La différence est cuite dans le dataset, pas dans l'algorithme.
- **1 colonne vertébrale** : le `VOCAB` (atomes + 74 tricks + aliases) sert le matcher, le composeur, la grammaire, et bientôt les labels du fine-tune. Construit une fois, réutilisé partout.
- **Le seul trou** : les noms de tricks *dans* une passe jib → fine-tune jib (collecte à lancer).
