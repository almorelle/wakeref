# Fine-tuning du modèle de reconnaissance vocale (tricks)

But : à partir des clips collectés dans `/judge/voix` (mode guidé → bouton
**Exporter (.zip)**), entraîner un **petit Whisper spécialisé** sur ton vocabulaire
+ ta voix, puis le rebrancher dans l'app comme un modèle local de plus.

Le `.zip` est au format **audiofolder** : `audio/NNNN.webm` + `metadata.csv`
(`file_name, transcription, stt, slug, discipline, model`). La cible
d'entraînement = `transcription` (le **nom canonique** du trick confirmé) → le
modèle devient un *reconnaisseur de trick*, et le matcher de l'app reste un filet.

## La voie simple : deux notebooks Colab (gratuit)

Tout se fait dans le navigateur, rien à installer sur ta machine.

1. **`wakeref_finetune_colab.ipynb`** — entraîne le modèle (T4 GPU, ~20-40 min) et
   te télécharge `whisper-wakeref.zip` (~290 Mo). Uploade ton dataset `.zip` à la
   cellule 2.
2. **`wakeref_export_hf_colab.ipynb`** — convertit en ONNX (via Optimum), copie le
   tokenizer, et pousse sur ton compte Hugging Face. Uploade `whisper-wakeref.zip`,
   renseigne ton `USER` + ton token **Write**.

Puis dans l'app : ajoute le repo dans `MODELS` de `src/lib/whisperStt.js` et une
entrée du sélecteur dans `JudgeVoice.jsx` (déjà fait pour `almorelle/whisper-wakeref-onnx`).

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
