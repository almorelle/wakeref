---
license: mit
language:
- fr
library_name: transformers.js
pipeline_tag: automatic-speech-recognition
base_model: openai/whisper-base
base_model_relation: finetune
tags:
- whisper
- onnx
- transformers.js
- wakeboard
- wakeskate
- speech-recognition
inference: false
---

# whisper-wakeref-onnx

Whisper-base **fine-tuné** pour reconnaître les noms de **tricks de wakeboard /
wakeskate / wakeboard assis**, utilisé par l'outil de jugement vocal de
[WakeRef](https://wakeref.app) (`/judge/voix`). Exporté en **ONNX** pour tourner
**en local dans le navigateur** via [Transformers.js](https://github.com/huggingface/transformers.js).

## Particularité

Le modèle est entraîné à produire directement le **nom canonique du trick**
(ex. `TS BS 360`, `Crow Mobe`, `Blind Judge`) à partir d'une dictée — pas une
transcription libre. Sur un vocabulaire **fermé**, il agit donc comme un
*reconnaisseur de trick*. Une couche de matching applicative reste branchée en
filet pour rattraper les quasi-correspondances.

## Données & entraînement

- ~1 300 clips audio courts (push-to-talk), dictés et étiquetés via le mode de
  collecte guidée de WakeRef ; 221 tricks (wakeboard, wakeskate, seated).
- Cible = nom canonique du trick (colonne `transcription`).
- Base : `openai/whisper-base` · langue `fr` · tâche `transcribe`.
- Meilleure **WER d'éval ≈ 16 %** (split 10 %, même locuteur).

## Limites

- **Mono-locuteur** : adapté à la voix de l'auteur. Pour d'autres juges, ré-entraîner
  avec davantage de locuteurs et de conditions audio.
- Vocabulaire **fermé** au catalogue WakeRef ; hors de ce domaine, le comportement
  n'est pas pertinent.
- Mélange français / jargon anglais propre au wake.

## Fichiers

ONNX (fp32) au format Transformers.js :
`onnx/encoder_model.onnx`, `onnx/decoder_model_merged.onnx` (+ variantes), avec
les configs et le tokenizer à la racine.

## Utilisation (Transformers.js)

```js
import { pipeline } from '@huggingface/transformers';

const transcriber = await pipeline(
  'automatic-speech-recognition',
  'almorelle/whisper-wakeref-onnx',
  { dtype: { encoder_model: 'fp32', decoder_model_merged: 'fp32' } }
);
const { text } = await transcriber(audioFloat32_16kHz, { language: 'french', task: 'transcribe' });
```
