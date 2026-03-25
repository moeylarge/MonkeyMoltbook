#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = '/Users/moey/.openclaw/workspace';
const shotDir = path.join(root, 'friends-ai-pilot-assets/quality-rebuild/shot-08-final-spiral-button');
const envPath = path.join(root, 'friends-ai/.env');
const startFramePath = path.join(shotDir, 'fal-input/08-final-spiral-locked-still-square-pad.png');
const lockedStillPath = path.join(shotDir, 'outputs/2026-03-25/shot-08-final-spiral-2026-03-25-direct-pass-2-strongclean-v2.png');
const promptPath = path.join(shotDir, 'motion-prompt-v1-kling-o1-reference.md');
const outDir = path.join(shotDir, 'motion-clips/2026-03-25');
const stamp = 'shot-08-final-spiral-2026-03-25-motion-pass-1-kling-o1-reference';
const outPath = path.join(outDir, `${stamp}.mp4`);
const metaPath = path.join(outDir, `${stamp}.json`);

function loadEnv(file) {
  const raw = fs.readFileSync(file, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
function mimeFromExt(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  throw new Error(`Unsupported reference extension: ${ext}`);
}
function toDataUri(file) {
  const mime = mimeFromExt(file);
  const b64 = fs.readFileSync(file).toString('base64');
  return `data:${mime};base64,${b64}`;
}
async function main() {
  loadEnv(envPath);
  const falKey = process.env.FAL_KEY;
  if (!falKey) throw new Error('FAL_KEY missing');
  fs.mkdirSync(outDir, { recursive: true });

  const promptMd = fs.readFileSync(promptPath, 'utf8');
  const prompt = promptMd.split('## Prompt')[1]?.split('## Negative constraints')[0]?.trim() || promptMd.trim();
  const negative = promptMd.split('## Negative constraints')[1]?.trim() || '';
  const joinedPrompt = negative ? `${prompt}\n\nNegative constraints:\n${negative}` : prompt;
  const input = {
    prompt: joinedPrompt,
    image_urls: [toDataUri(startFramePath), toDataUri(lockedStillPath)],
    duration: '5',
    aspect_ratio: '1:1'
  };

  const res = await fetch('https://fal.run/fal-ai/kling-video/o1/reference-to-video', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(input)
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${JSON.stringify(data).slice(0, 4000)}`);
  const videoUrl = data.video?.url || data.video_url || data.output?.url;
  if (!videoUrl) throw new Error(`No video URL in response: ${JSON.stringify(data).slice(0, 4000)}`);

  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) throw new Error(`Failed to download video: ${videoRes.status} ${videoRes.statusText}`);
  const buffer = Buffer.from(await videoRes.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
  fs.writeFileSync(metaPath, JSON.stringify({ input, response: data, saved: outPath }, null, 2));
  console.log(JSON.stringify({ ok: true, outPath, metaPath, videoUrl }, null, 2));
}
main().catch((err) => {
  console.error(err.stack || String(err));
  process.exit(1);
});