# Fine-tuning du modèle de reconnaissance vocale (tricks)

But : à partir des clips collectés dans `/judge/voix` (mode guidé → bouton
**Exporter (.zip)**), entraîner un **petit Whisper spécialisé** sur ton vocabulaire
+ ta voix, puis le rebrancher dans l'app comme un modèle local de plus.

> **Modèle actuel :** [`almorelle/whisper-wakeref-onnx`](https://huggingface.co/almorelle/whisper-wakeref-onnx)
> (whisper-base fine-tuné, ONNX/Transformers.js) — branché dans l'app sous
> `MODELS.wakeref` (`src/lib/whisperStt.js`), sélecteur « maison ✨ ».

Le `.zip` est au format **audiofolder** : `audio/NNNN.webm` + `metadata.csv`
(`file_name, transcription, stt, slug, discipline, model`). La cible
d'entraînement = `transcription` (le **nom canonique** du trick confirmé) → le
modèle devient un *reconnaisseur de trick*, et le matcher de l'app reste un filet.

## Collecter (ou enrichir) le dataset

Tout se passe dans l'app, sur **`/judge/voix`** (moteur **Local**) :

1. Coche **« mode guidé »**. L'app parcourt les tricks de la discipline **du moins
   au plus couvert**, affiche la cible (nom + variantes suggérées) et un compteur
   de couverture + la liste des tricks jamais enregistrés.
2. Dicte le trick affiché. Raccourcis (mains quasi libres) :
   - **Espace** (maintenir) = enregistrer une prise ; relâcher = stop.
   - **→** = trick suivant.
   - **↩ annuler le dernier** = jeter un clip raté (bruit, voix parasite).
3. Vise **~3-5 prises *variées* par trick** (forme courte, avec chiffre, avec
   « toe », lecture du nom…) — c'est la variété qui apprend le mapping
   « plusieurs façons de dire → un nom ». **Sur-représente le jargon dur**
   (Crow Mobe, Scarecrow, Railey…).
4. Change la **Discipline** (wakeboard / wakeskate / seated) pour tout couvrir.
5. **« Exporter (.zip) »** → ton dataset, prêt pour l'entraînement ci-dessous.

Notes :
- En mode guidé, **aucun modèle n'est nécessaire** (le label = la cible affichée),
  c'est rapide et hors-ligne.
- Le stockage est **local (IndexedDB)** et **persiste** entre sessions tant que tu
  reviens sur la **même origine** (`localhost:5173`, fenêtre normale — pas
  incognito). Exporte régulièrement comme sauvegarde.
- Une seule voix = modèle adapté à TA voix. Pour d'autres juges, fais enregistrer
  d'autres personnes (mêmes étapes) avant de ré-entraîner.

## La voie simple : deux notebooks Colab (gratuit)

Tout se fait dans le navigateur, rien à installer sur ta machine.

1. **`wakeref_finetune_colab.ipynb`** — entraîne le modèle (T4 GPU, ~20-40 min) et
   te télécharge `whisper-wakeref.zip` (~290 Mo). Uploade ton dataset `.zip` à la
   cellule 2.
2. **`wakeref_finetune_multi_colab.ipynb`** — entraîne le modèle (T4 GPU, ~20-40 min) et
   te télécharge `whisper-wakeref.zip` (~290 Mo). Uploade plusieurs dataset `.zip` à la
   cellule 2.
3. **`wakeref_export_hf_colab.ipynb`** — convertit en ONNX (via Optimum), copie le
   tokenizer, et pousse sur ton compte Hugging Face. Uploade `whisper-wakeref.zip`,
   renseigne ton `USER` + ton token **Write**.

Puis dans l'app : ajoute le repo dans `MODELS` de `src/lib/whisperStt.js` et une
entrée du sélecteur dans `JudgeVoice.jsx` (déjà fait pour
[`almorelle/whisper-wakeref-onnx`](https://huggingface.co/almorelle/whisper-wakeref-onnx)).

## Améliorer le modèle (ajouter des voix, plus de données)

Le modèle actuel est entraîné sur **une seule voix** → il connaît surtout TA
prononciation. Pour le rendre robuste à d'autres juges :

1. **Collecte multi-voix.** Chaque personne fait une session de collecte (même
   procédure « mode guidé » ci-dessus, sur SON appareil/navigateur) et **exporte
   son propre `.zip`** (les données sont locales à chaque appareil). Tu récupères
   ainsi plusieurs zips.
2. **Garde TOUT.** On ne « continue » pas l'entraînement par-dessus le modèle
   existant (ça figerait le biais vers la 1ʳᵉ voix). On **ré-entraîne depuis
   `openai/whisper-base`** sur l'**union** de toutes les données (les tiennes +
   celles des autres). Conserve donc tes anciens zips.
3. **Fusionne les zips** en un seul dataset. Dans le [notebook d'entraînement multi](training/wakeref_finetune_multi_colab.ipynb),
   qui prend plusieurs zips et produit un `ds/` unifié :
   (Renumérote les fichiers pour éviter les collisions, concatène les
   `metadata.csv`, et convertit en wav — comme la cellule d'origine.)
4. **Lance l'entraînement** (cellule suivante, inchangée) puis **ré-exporte +
   re-pousse** sur le même repo HF (notebook 2). L'app pointant déjà sur
   `almorelle/whisper-wakeref-onnx`, elle prendra la nouvelle version au prochain
   chargement (au besoin, vide le cache du site pour forcer le re-téléchargement).

> Plus de voix et de conditions (micros, ambiances) = meilleure généralisation.
> Pense aussi à **équilibrer** : le mode guidé montre la couverture par trick, mais
> l'équilibre **par locuteur** est à surveiller à la main.

## Pièges déjà rencontrés (corrigés dans les notebooks)

- **`datasets.map` sature la mémoire** → l'audio est chargé À LA VOLÉE dans le
  collator (`finetune_whisper.py`), pas de pré-traitement de masse.
- **Zip de 6 Go** = checkpoints d'entraînement → `save_total_limit=1` + on supprime
  `checkpoint-*` avant de zipper (zip ≈ 290 Mo).
- **L'ancien `scripts/convert.py` de transformers.js n'existe plus** (monorepo) →
  conversion via **`optimum-cli export onnx … --task automatic-speech-recognition-with-past`**.
- **Optimum n'exporte pas le tokenizer** → on copie `tokenizer*/vocab/merges/
  normalizer/special_tokens/added_tokens` depuis le modèle PyTorch vers le repo
  (sinon l'app plante : `tokenizer is null`). Le tokenizer d'un whisper-base
  fine-tuné = celui de whisper-base (vocabulaire inchangé).
- **`notebook_login()` ne bloque pas** → l'upload partait avant l'auth (401). On
  utilise `login(token="hf_…")` qui authentifie immédiatement.
- **Ne pas faire `pip install -U huggingface_hub`** seul dans Colab : ça casse la
  compat avec `transformers` (import `DryRunError`). Colab a déjà une version OK.

## Notes

- **Une seule voix** : modèle adapté à TA voix ; pour d'autres juges → plus de
  données/locuteurs, ré-entraîner.
- **Couverture** : collecte aussi wakeskate/seated (sélecteur Discipline) si voulu.
- **Itère** : ré-entraîne quand tu as significativement plus de clips.
