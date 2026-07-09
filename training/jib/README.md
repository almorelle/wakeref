# Fine-tuning du modèle de reconnaissance vocale — **passes de JIB**

Pipeline **distinct** de celui des tricks (`../README.md`). Ici on entraîne un
Whisper à **transcrire une passe de jib entière** — une séquence compositionnelle
d'atomes (structure + approche + rotation + slide + grab + trick) — et non à
reconnaître un trick isolé.

> Pourquoi un modèle à part ? Voir `proto-assets/voix-jib-explications.md`.
> En résumé : une passe est **compositionnelle**, on ne peut pas énumérer toutes
> les combinaisons. Un Whisper séquence-à-séquence apprend les **atomes** + leurs
> enchaînements et **généralise** aux combinaisons jamais entendues — à condition
> que chaque atome soit couvert dans des contextes variés. C'est exactement ce que
> ni whisper-small générique (acoustique jargon faible) ni le modèle tricks
> (classifieur mono-trick) ne savent faire.

## Différences avec le pipeline tricks

| | Tricks (`../`) | **Jib (ici)** |
|---|---|---|
| Base | `openai/whisper-base` | **`openai/whisper-small`** (meilleur FR, jargon dense) |
| Cible `transcription` | nom canonique d'**un** trick | **texte complet de la passe** corrigé par le juge |
| Nature | classifieur *de facto* (set fermé) | **transcripteur compositionnel** (open-ended) |
| Longueur de sortie | courte (`max_length=64`) | plus longue (`max_length=128`) |
| Collecte | `/judge/voix` **mode guidé** | `/judge/voix` **dictée libre (jib)** + case *collecter* |
| Export .zip | `wakeref-voix-dataset-*.zip` | `wakeref-voix-dataset-jib-*.zip` |
| Repo HF cible | `…/whisper-wakeref-onnx` | `…/whisper-wakeref-jib-onnx` |

## La cible d'entraînement (point important)

La colonne `transcription` du `metadata.csv` = **le texte que le juge a corrigé
dans le champ éditable** (pas le brut STT, colonne `stt`). C'est donc la forme
**normalisée** voulue à l'écran, ex. :

```
audio → "ollie backlip to boardslide 270 out"
```

Conséquence : le modèle apprend **acoustique + normalisation en même temps**
(`frontside`/`deux sept` → `FS 270`, réordonnancements inclus). Le composeur
`normalizeJib` reste branché **en filet** derrière, comme le matcher pour les
tricks. → collecte soigneusement : **corrige chaque passe dans le champ avant
d'enchaîner**, la dernière valeur du champ = la vérité terrain enregistrée.

## 1. Collecter le dataset

Dans l'app, `/judge/voix`, moteur **Local** :

1. Coche **« dictée libre (jib) »** (bascule auto sur whisper-small sans biais).
2. Coche **« grammaire »** (structure propre → moins à corriger) et
   **« collecter (dataset jib) »**.
3. Dicte une **passe entière** (maintiens **Espace**). Le texte normalisé
   s'affiche dans un champ éditable, le brut STT reste visible dessous.
4. **Corrige le champ** — surtout les **noms de tricks** (ce qui manque au
   modèle). C'est la correction qui devient la cible.
5. Enchaîne. Compteur « N passes » ; **Exporter (.zip)** = ton dataset jib.

Objectif de couverture : **pas** l'exhaustivité des combinaisons (impossible),
mais **chaque atome vu plusieurs fois, à des positions différentes** (en entrée,
au milieu, en sortie), et **varie les tournures** (`deux sept`/`270`,
`frontside`/`front`, ordres). Sur-représente les tricks nommés durs.

> Stockage **local (IndexedDB)**, persiste tant que tu reviens sur la même origine
> (`localhost:5173`, fenêtre normale). Exporte régulièrement comme sauvegarde.

## 2. Entraîner (Colab gratuit, T4)

> **Transfert des .zip via Google Drive** (baké dans les notebooks) : mets ton
> `.zip` (dataset ou modèle) dans Drive, la cellule monte Drive et lit depuis
> `ZIP = '/content/drive/MyDrive/…'`. Drive ↔ Colab = **serveur-à-serveur (rapide)**,
> contrairement à `files.upload()` (bridé, passe par le navigateur). Repli upload
> manuel en commentaire dans chaque cellule.

**Recommandé — tout-en-un : `wakeref_jib_train_export_colab.ipynb`.** Entraîne
whisper-base, convertit en ONNX, quantize q8 et pousse sur HF **dans une seule
session** — le modèle reste sur le disque Colab, **jamais de download/re-upload**
sur ta machine. Uploade ton `.zip` jib, renseigne `USER`/token HF, lance tout.

<details><summary>Variante en 2 notebooks (si tu veux un checkpoint local)</summary>

1. **`wakeref_jib_finetune_colab.ipynb`** — uploade ton `.zip` jib, entraîne
   **whisper-base** (~20-40 min sur T4), télécharge `whisper-wakeref-jib.zip`.
   > **base, pas small** : small est trop lent en transcription (15-30 s/passe, même
   > WebGPU) car le décodage est autorégressif et une passe = beaucoup de tokens. base
   > = ~3× moins de calcul/token → temps réel (c'est le socle du modèle *tricks*).
   > La quantization pour rattraper small a échoué (q4 absent d'onnxruntime Colab ;
   > fp16 via onnxconverter_common casse le graphe Whisper) → base fp32 natif = sûr.
2. **`wakeref_jib_export_hf_colab.ipynb`** — convertit en ONNX (Optimum),
   **quantize en q8** (pour le repli WASM), copie le tokenizer, pousse sur
   `TON_USER/whisper-wakeref-jib-onnx`.

</details>

> `wakeref_jib_q4_patch_colab.ipynb` est un **cul-de-sac** (q4/fp16 non fonctionnels
> pour ce modèle) — ignoré.

## 3. Brancher dans l'app (après entraînement)

Le modèle jib remplace whisper-small **dans le mode dictée libre uniquement**.

1. `src/lib/whisperStt.js` :
   - ajoute l'entrée `MODELS.wakerefJib = 'TON_USER/whisper-wakeref-jib-onnx'` ;
   - dans `dtypeFor` : WebGPU → `{ encoder_model: 'fp32', decoder_model_merged:
     'fp32' }` (base est assez léger pour du fp32 temps réel) ; WASM → `{ encoder_model:
     'q8', decoder_model_merged: 'q8' }`. **q8 n'est pas un dtype WebGPU** (le forcer
     fait retomber en WASM/CPU, lent → d'où le log de backend dans `loadWhisper`).
2. `src/pages/JudgeVoice.jsx`, `toggleFreeJib(on)` : remplace `pickModel('small')`
   par `pickModel('wakerefJib')` (garde le repli small tant que le repo n'existe
   pas).
3. **Ré-active les tricks dans la grammaire.** Une fois l'acoustique du jargon
   bonne, le risque d'empoisonnement (`scarecrow→slob`) disparaît : passe
   `grammarPhrases(jibTricksRef.current)` (avec tricks) au lieu de
   `grammarPhrases()` dans `jibGrammar`. Le fine-tune choisit le bon atome, la
   grammaire **verrouille** qu'il soit dans le vocabulaire → le « trou » se referme.

## Notes & pièges (hérités du pipeline tricks)

- **whisper-small ONNX fp32 est lourd** (~855 Mo). Le notebook d'export **quantize
  en q8** (~215 Mo, ÷4) → c'est le dtype branché dans l'app. Si q8 dégradait trop le
  jargon (à vérifier au test), replis possibles : garder fp32, ou `--base
  openai/whisper-base` (plus léger dès le départ).
- `datasets.map` sature la RAM → audio chargé **à la volée** dans le collator.
- Zip d'entraînement lourd = checkpoints → `save_total_limit=1` + `rm checkpoint-*`
  avant de zipper.
- **Optimum n'exporte pas le tokenizer** → on le copie du modèle PyTorch (sinon
  l'app plante `tokenizer is null`). Tokenizer d'un whisper-small fine-tuné =
  celui de whisper-small (vocabulaire inchangé).
- `login(token="hf_…")` **avant** le push (bloquant), sinon 401.
- Ne pas `pip install -U huggingface_hub` seul dans Colab (casse `transformers`).

## Limites attendues

- **Petit dataset au départ** (dictée libre = plus coûteuse que le mode guidé) →
  la WER d'éval est indicative ; itère en collectant plus de passes.
- **Mono-locuteur** : adapté à ta voix ; d'autres juges → ré-entraîner avec leurs
  enregistrements (garde tous les zips, ré-entraîne depuis `openai/whisper-small`
  sur l'union, ne continue pas par-dessus).
