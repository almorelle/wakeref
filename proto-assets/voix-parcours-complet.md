# Reconnaissance vocale pour le jugement — le parcours complet

Journal de bord de la feature « saisie d'un run à la voix » (`/judge/voix`) : tout
ce qu'on a essayé, ce qui a marché, ce qui a moins bien marché, et pourquoi. Sert
de mémoire pour ne pas refaire les mêmes détours.

Docs liés : `proto-assets/voix-jib-explications.md` (pédagogie du modèle jib),
`training/jib/README.md` (pipeline d'entraînement), `proto-assets/architecture.md`
(schémas). Code : `src/lib/whisperStt.js`, `src/lib/normalizeJib.js`,
`src/lib/voiceMatch.js`, `src/lib/voiceDataset.js`, `src/pages/JudgeVoice.jsx`.

---

## 0. Objectif & contraintes

Permettre à un **juge en compétition** de dicter un run à la voix, l'app proposant
un texte propre à valider/corriger. Contraintes posées :

- **100 % on-device, zéro backend, zéro coût récurrent** (appareil dédié, on a le
  temps de préparer, embarqué lourd OK).
- **Offline au runtime**, tous navigateurs (pas seulement Chrome).
- **Pas d'OpenAI comme vendeur** (modèle open-source OK).
- **Validation humaine** = invariant produit (l'app propose, l'humain tranche).
- L'audio n'est traité qu'une fois → RGPD trivial (rien n'est stocké côté serveur).

Deux natures de saisie, vite apparues comme **deux problèmes distincts** :

1. **Trick isolé** (air / kicker / flat) : une figure = un nom → un problème de
   **classification** sur un set fermé.
2. **Passe de jib** : une séquence **compositionnelle** d'atomes (structure +
   approche + rotation + slide + grab + trick) → un problème de **transcription**.

---

## 1. Les données d'abord (le vrai socle)

**Leçon fondatrice : le goulot n'était pas le STT, mais les données.** Un moteur
générique écorche le jargon wake ; ce qui rend la reco utilisable, c'est une couche
d'**alias** qui voyage avec la donnée.

- Ajout de `figures.aliases[]` (ex. « tan »→tantrum, « 3 »→360, « 1/2 cab »→half
  cab) + RPC de recherche alias-aware. Migrations `0008`/`0009`/`0010`.
- Seed généré par `scripts/gen-aliases.mjs` (rejouable) : combinatoire systématique
  pour les spins (approche/sens omis, centaines parlées FR+EN) + dico de surnoms
  pour les tricks nommés. ~174 figures, ~1000+ alias au fil des itérations.
- **Ce qui a marché** : itérer les alias sur de **vrais logs** de dictée (jamais à
  l'aveugle). À chaque log, mesurer top-1 + non-régression via un harnais.

---

## 2. Le STT : de la Web Speech API à Whisper local

### Palier 1 — Web Speech API (natif navigateur)
- **Marché** : zéro asset, dictée live immédiate.
- **Moins bien** : **online + Chrome-only**. Échoue en `network` sur
  Brave/Arc/Chromium (pas de clé API Google). Rédhibitoire → a déclenché le palier 2.

### Palier 2 — Whisper local via transformers.js
- `@huggingface/transformers`, modèles `onnx-community` (base / small /
  large-v3-turbo), servis du CDN HF au **runtime** (hors bundle, hors précache PWA).
  WebGPU si dispo, repli WASM.
- **Isolation** : chunk lazy, `workbox.globIgnores` exclut transformers + wasm du
  précache.
- **Résultats** : base = faible en FR/jargon ; small = mieux ; large = meilleur
  **mais** trop lent + bug « stuck » après ~20 tricks. Verdict : un générique ne
  suffit pas, et le large est inutilisable en live.
- **Prompt biasing** (`BIAS_VOCAB`) tenté : **dégrade** whisper-small sur le jib
  (sur-oriente le décodeur) → abandonné pour le jib.

---

## 3. Le matcher local (pour les tricks isolés)

- `src/lib/voiceMatch.js` : matcher 100 % local, zéro dépendance. Score par paliers
  (égalité compacte > sous-chaîne pondérée couverture > Jaccard tokens) + **fuzzy**
  (Levenshtein) calibré sur les erreurs réelles.
- **Marché** : sur set fermé + alias, top-1 quasi partout après tuning ; filtre
  discipline lève les collisions (seated « un back » vs standing).
- **Moins bien** : plafond quand le STT déraille totalement (« Skerchrom »→Scarecrow)
  → aucun matcher ne récupère. D'où le besoin d'un modèle qui **connaît** le jargon.

---

## 4. Le modèle maison « tricks » (fine-tune)

- **Collecte** : mode **guidé** dans `/judge/voix` (parcourt les tricks du moins au
  plus couvert, label = cible affichée → pas besoin du modèle). Stockage IndexedDB
  local (`voiceDataset.js`), export `.zip` audiofolder HuggingFace.
- **Entraînement** : whisper-**base** fine-tuné, cible = **nom canonique du trick**.
  ~1321 clips / 221 tricks, **WER ≈ 16 %**. Export ONNX (Optimum) → HF
  `almorelle/whisper-wakeref-onnx`, branché sous « maison ✨ ».
- **Marché** : reconnaît directement le nom du trick, matcher = filet. Rapide (base,
  sortie courte). **C'est la config de référence temps réel.**
- **Nuance importante** : ce modèle **se comporte** comme un classifieur, mais c'est
  un whisper séquence-à-séquence — le comportement « 1 trick » est **émergent** de
  son dataset (que des tricks isolés), pas structurel.

---

## 5. Le jib : composeur + grammaire

Une passe est compositionnelle → impossible d'énumérer les combinaisons. Approche en
deux temps (voir `voix-jib-explications.md`).

### 5.1 Le composeur `normalizeJib` (vocab-driven)
- Remplace un tas de regex par : normalisation des **rotations** (convention wake
  chiffres→degrés) + un **VOCAB** d'atomes (canon + variantes) + matching gloutonné
  (le plus long d'abord) + **fuzzy** + **assemblage** (direction collée à sa rotation
  → « back 180 » → « BS 180 »).
- **Marché** : data-driven (ajouter un trick = une ligne), dégradation douce
  (atome inconnu = passthrough éditable). Harnais rejouable
  `scripts/test-normalize-jib.mjs` → **~112/116** sur vrais logs.
- **Leçon** : les 4 « échecs » restants ne sont pas des bugs — ce sont des
  **corrections sémantiques** de l'utilisateur (label ≠ ce qui est dit) ou des
  garbles rares. Pour un dataset, **le label doit matcher l'AUDIO**, pas le trick
  réellement fait.

### 5.2 La grammaire contrainte (LogitsProcessor)
- Contraint la sortie de whisper à un chemin valide du vocabulaire (une passe =
  `atome*`), en masquant les logits hors-vocab **pendant** le décodage.
- **Marché** : la **structure** d'une passe ressort très propre.
- **Moins bien** : (a) **empoisonnement** quand on y met les noms de tricks — sur
  whisper-small générique, il choisit le mauvais atome valide (`scarecrow→slob`,
  `toeside→skeletor`) → tricks **exclus** de la grammaire tant que l'acoustique est
  mauvaise ; (b) elle peut **couper aux pauses** (EOS autorisé à chaque frontière) →
  troncatures ; (c) **coût CPU** par token (masquage sur ~51865 logits).
- **Leçon** : même problème d'empoisonnement dans le **composeur** si on y injecte
  les 74 tricks kicker (leurs alias structurels avalent la structure : « back blind »
  → Roll to Blind). → composeur = **VOCAB seul**, les tricks jib nommés (Scarecrow,
  Tantrum, Mexican Roll, Pretzel) sont dans le VOCAB en dur.

---

## 6. Le modèle maison « jib » (fine-tune sur passes)

- **Différence clé vs tricks** : cible = **texte complet de la passe** corrigé (pas
  un nom isolé) → transcripteur **compositionnel** qui généralise aux combinaisons
  jamais vues (interpolation d'atomes), à condition de couvrir chaque atome dans des
  contextes variés. **Même technique, dataset différent.**
- **Collecte** : mode **dictée libre (jib)** + case « collecter » branchée dans
  `voiceDataset` (champs `kind:'jib'`, `gram`). La cible se recale sur l'édition du
  textarea (vérité terrain). Lecteur audio par passe + liste en pile (dernière en
  haut) pour ne pas scroller.
- **Pipeline** dédié `training/jib/` (distinct des tricks). Cible normalisée → le
  modèle apprend **acoustique + normalisation** ensemble ; composeur = filet.
- **Résultat (small)** : « marche très bien, avec et sans grammaire » (qualité).
  Une fois l'acoustique bonne, on a **remis les tricks dans la grammaire** (elle ne
  fait plus que verrouiller).
- **Découverte terrain** : whisper-small tronque parfois le brut (mais **l'audio est
  complet**) → probable EOS prématuré aux pauses, surtout sous grammaire. N'affecte
  **pas** le dataset (audio complet + label correct) ; le fine-tune l'atténue.

---

## 7. La saga de la vitesse (le mur actuel)

Le modèle jib small marche bien **mais transcrit en 15-30 s** → inutilisable en live.
Enquête et tentatives :

| Tentative | Résultat |
|---|---|
| **q8 forcé sur tous backends** | q8 n'est **pas** un dtype WebGPU → échec WebGPU → **repli WASM/CPU** (lent). Corrigé : dtype par device + log du backend. |
| **Warmup au préchargement** | La 1re inférence WebGPU compile les shaders (~10-20 s) → warmup muet au `loadWhisper` pour sortir ce coût du live. **Utile**, mais steady-state restait lent. |
| **Décodeur q4 (4 bits)** | **Bloqué** : `matmul_4bits_quantizer` **absent** de l'onnxruntime dispo sur Colab (trou de packaging), même après `-U`. |
| **fp16 (onnxconverter_common)** | **Graphe cassé** : `TypeInferenceError` onnxruntime (sortie fp16 attendue en fp32 dans la cross-attention/Cast du décodeur). Convertir enc+dec en fp16 complet ne fait que **déplacer** l'erreur de nœud. Bug connu de l'outil. Abandonné. |
| **whisper-base (ré-entraînement)** | fp32 natif, zéro conversion. ~2× plus rapide (**8-15 s**) **mais qualité nettement moins bonne** (trop d'erreurs, même avec grammaire). |

### Le diagnostic de fond
Le décodage est **autoregressif** : les tokens sortent **un par un, en série**. Une
passe jib est **longue** (~40 tokens) → temps ≈ (coût/token) × (nb tokens). Le modèle
tricks (même base) répond en ~2 s car il sort ~5 tokens ; une passe en sort ~40 →
mécaniquement ~8-15 s. **Réduire la taille du modèle ne suffit pas** (et dégrade la
qualité), car le nombre de tokens est fixé par la longueur de la passe. **Le
navigateur ne rendra pas ça instantané sur une sortie longue.**

### Pièges rencontrés (transverses)
- **Cache modèle** : transformers.js met en cache les fichiers par **URL**.
  Re-pousser **sous le même nom** ne rafraîchit pas (hard reload insuffisant) → vider
  via DevTools → Application → **Clear site data**.
- **`files.upload()` de Colab est le vrai goulot** des uploads (bridé, passe par le
  navigateur), pas la fibre. **HF ↔ Colab = serveur-à-serveur** (rapide) → patcher/
  exporter en tirant depuis le repo HF plutôt qu'en ré-uploadant.
- **Deux notebooks** (train puis export) imposaient un download+re-upload inutile du
  modèle → fusionnés en **un seul** (`wakeref_jib_train_export_colab.ipynb`), le
  modèle reste sur le disque Colab.

---

## 8. La résolution : small + file d'attente non-bloquante

**Le levier « vitesse d'inférence » est épuisé.** Le vrai problème live n'est pas les
15 s en soi, c'est que la transcription **bloquait** la dictée suivante (`busy`). Or en
jugement, on valide/corrige **après** le run. Deux gestes, tous deux **livrés** :

1. **Retour au modèle `small`** (meilleure qualité ; base faisait trop d'erreurs *et*
   ne gagnait que ~2×). Le zip small (~900 Mo) re-poussé via l'export — en le tirant
   de **Google Drive** (les notebooks jib lisent désormais depuis
   `/content/drive/MyDrive/…`, fini `files.upload()`).
2. **File d'attente non-bloquante** dans `/judge/voix` (mode dictée libre uniquement).

**Modèles en présence :**
- `almorelle/whisper-wakeref-onnx` — tricks isolés (base, temps réel). **Reste.**
- `almorelle/whisper-wakeref-jib-onnx` — passes jib (**small**, qualité voulue).

### 8.1 La file d'attente — détails techniques (`src/pages/JudgeVoice.jsx`)

Principe : **découpler l'enregistrement de la transcription**. Enregistrer est
instantané ; transcrire est lent → on transcrit **en tâche de fond, en série**, sans
jamais bloquer la dictée.

**Enregistrement (`MediaRecorder.onstop`, branche `freeJib`)** — ne transcrit plus
sur place :
- crée aussitôt une entrée `{ id, url, status: 'pending', raw:'', text:'' }` en tête
  de liste (`url` = `URL.createObjectURL(blob)` → **audio réécoutable immédiatement**) ;
- empile `{ id, blob, mime, gram, model, bias }` dans `jibQueueRef` (une `ref`, pas
  d'état) ;
- appelle `processJibQueue()` et **retourne tout de suite** — pas de `setBusy(true)`
  en dictée libre → la dictée n'est jamais bloquée.

**Worker (`processJibQueue`, `useCallback([])`)** — un seul à la fois via le drapeau
`jibProcessingRef` :
- tant que la file n'est pas vide : `shift()`, `blobToMono16k` → `transcribe(...)`
  (avec `constrain=item.gram`, `model=item.model`), `normalizeJib(text)` ;
- met à jour l'entrée **par `id`** (`setJibEntries(prev => prev.map(...))`) →
  `status:'done'` + `raw`/`auto`/`text`, ou `status:'error'` (`(rien entendu)` /
  `(échec transcription)`) ;
- si collecte active : `addSample({ blob, sttText, labelName:auto, kind:'jib', … })`,
  le label se recalant ensuite sur l'édition du textarea (vérité terrain dataset).

**Cohérence de la file :**
- `removeJib(id)` retire aussi l'item de `jibQueueRef` (une passe supprimée avant
  transcription n'est pas traitée) + révoque l'`url` + supprime le sample collecté.
- `resetJib()` vide la file, révoque toutes les `url`, oublie le mapping.
- Démontage : révocation des `url` restantes (via `jibEntriesRef`).

**Rendu conditionnel :** `pending` → « ⏳ transcription en cours… » + audio (pas de
textarea, pour ne pas se faire écraser à la complétion) ; `done`/`error` → textarea
éditable + ligne « brut ». Indicateur **« N en transcription… »** dans la barre.
Nouvelles passes **en tête** (prepend) pour rester en haut de page.

**Ce qui NE change pas :** les modes tricks / guidé gardent le `busy` bloquant (adapté
à leur usage unitaire). Le blocage n'est retiré que pour la dictée libre.

**Résultat :** la latence 15-30 s existe toujours mais **sort du chemin critique** —
le juge enchaîne les passes pendant le run, les champs se remplissent au fur et à
mesure, et la validation/correction se fait à la fin.

---

## 9. Pistes futures (réserve)

- **whisper.cpp natif** (Metal) sur l'appareil de jugement : vrai temps réel +
  qualité large, mais sort du PWA pur (companion local). Le plus prometteur si le
  temps réel strict devient impératif.
- **Quantization propre** via l'outil de conversion **officiel** transformers.js
  (produit des fp16/q4 qui marchent sur WebGPU, contrairement à onnxconverter_common)
  — si on veut garder small tout en gagnant en vitesse.
- **Collecte multi-voix** pour robustesse (les modèles sont mono-locuteur).
- **Bouton « Composer le run »** : verser les passes/tricks validés dans la saisie du
  module compétition.

---

## 10. Leçons en une page

1. **Les données priment sur le modèle** (alias, dataset ciblé).
2. **Deux problèmes différents** (classification trick vs transcription passe) → deux
   modèles, même technique, datasets différents.
3. **La grammaire contrainte** verrouille le vocabulaire mais **empoisonne** un
   modèle générique et **coupe aux pauses** — à réserver à un modèle à bonne
   acoustique.
4. **Le label doit matcher l'audio** (sinon on apprend à halluciner).
5. **La vitesse d'un décodage autoregressif ∝ la longueur de sortie** — insoluble par
   la seule taille du modèle sur une passe longue en navigateur.
6. **Le vrai fix latence = architecture non-bloquante**, pas un modèle plus petit.
7. **Détails qui coûtent des heures** : cache par URL, `files.upload()` lent, q4
   absent d'onnxruntime, fp16 cassé par onnxconverter_common.
