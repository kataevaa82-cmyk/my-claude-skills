// Local Whisper ASR with transformers.js (offline model dir). Usage: node asr.mjs <f32le-16k-mono> <out.json> <modelRoot> [word|chunk]
import fs from 'node:fs';
import { pipeline, env } from '@huggingface/transformers';

const [, , inPath, outPath, modelRoot, mode = 'word'] = process.argv;
env.allowRemoteModels = false;
env.localModelPath = modelRoot;

const buf = fs.readFileSync(inPath);
const audio = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);

const asr = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small', {
  dtype: { encoder_model: 'q8', decoder_model_merged: 'q8' },
});
const t0 = Date.now();
const out = await asr(audio, {
  language: 'russian',
  task: 'transcribe',
  chunk_length_s: 30,
  stride_length_s: 5,
  return_timestamps: mode === 'word' ? 'word' : true,
  num_beams: Number(process.argv[6] || 1),
});
fs.writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log('done in', (Date.now() - t0) / 1000, 's');
console.log(out.text);
