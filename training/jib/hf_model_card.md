---
license: mit
language:
- fr
library_name: transformers.js
pipeline_tag: automatic-speech-recognition
base_model: openai/whisper-small
base_model_relation: finetune
tags:
- whisper
- onnx
- transformers.js
- wakeboard
- wakeskate
- jib
- speech-recognition
inference: false
---

# whisper-wakeref-jib-onnx

Whisper-small **fine-tuné** pour transcrire des **passes de jib** de câble
(wakeboard / wakeskate), utilisé par l'outil de jugement vocal de
[WakeRef](https://wakeref.app) (`/judge/voix`, mode dictée libre). Exporté en
**ONNX** pour tourner **en local dans le navigateur** via
[Transformers.js](https://github.com/huggingface/transformers.js).

## Particularité

Contrairement au modèle *tricks* ([`whisper-wakeref-onnx`](https://huggingface.co/almorelle/whisper-wakeref-onnx),
qui reconnaît **un** trick isolé), ce modèle **transcrit une passe entière** —
une séquence **compositionnelle** d'atomes : structure (`entrée`, `transfert`,
`out`), approche (`HS`/`TS`/`fakie`), rotation par pas de 90° (`180`, `270`,
`450`…), slide (`boardslide`, `backlip`, `nose press`), grab et trick nommé.

Étant séquence-à-séquence, il **généralise à des combinaisons jamais vues** dès
lors que chaque atome a été entendu dans des contextes variés — on n'énumère donc
pas les combinaisons. La cible d'entraînement est la forme **normalisée** voulue à
l'écran (ex. `ollie backlip to boardslide 270 out`) ; un composeur applicatif
(`normalizeJib`) reste branché en filet.

## Données & entraînement

- Passes audio dictées et corrigées via le mode **dictée libre (jib)** de WakeRef.
- Cible = **texte complet corrigé** de la passe (colonne `transcription`).
- Base : `openai/whisper-small` · langue `fr` · tâche `transcribe` ·
  `generation_max_length=128`.

## Limites

- **Mono-locuteur** : adapté à la voix de l'auteur. Pour d'autres juges,
  ré-entraîner avec davantage de locuteurs.
- **Domaine fermé** au jib de câble WakeRef ; hors de ce domaine, non pertinent.
- Mélange français / jargon anglais propre au wake.

## Fichiers

ONNX au format Transformers.js, sous `onnx/` : `encoder_model.onnx` /
`decoder_model_merged.onnx` (**fp32**, utilisés sur WebGPU) + variantes
`*_quantized.onnx` (**q8**, repli WASM). Configs et tokenizer à la racine.

> Note : d'anciens fichiers `*_fp16.onnx` issus d'essais de quantization peuvent
> traîner dans le repo — ils sont **cassés** (bug de conversion Whisper) et non
> utilisés par l'app ; à supprimer.

## Utilisation (Transformers.js)

```js
import { pipeline } from '@huggingface/transformers';

const transcriber = await pipeline(
  'automatic-speech-recognition',
  'almorelle/whisper-wakeref-jib-onnx',
  { dtype: { encoder_model: 'fp32', decoder_model_merged: 'fp32' } }
);
const { text } = await transcriber(audioFloat32_16kHz, { language: 'french', task: 'transcribe' });
```
