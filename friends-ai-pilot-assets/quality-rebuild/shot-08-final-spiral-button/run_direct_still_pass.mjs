#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = '/Users/moey/.openclaw/workspace';
const shotDir = path.join(root, 'friends-ai-pilot-assets/quality-rebuild/shot-08-final-spiral-button');
const envPath = path.join(root, 'friends-ai/.env');
const refPath = path.join(shotDir, 'fal-input/08-final-spiral-upload-ref-cleaned.jpg');
const promptPath = path.join(shotDir, 'hero-still-prompt-v1.md');
const outDir = path.join(shotDir, 'outputs/2026-03-25');
const stamp = '2026-03-25-direct-pass-1-cleanref';
const outPath = path.join(outDir, `shot-08-final-spiral-${stamp}.png`);
const metaPath = path.join(outDir, `shot-08-final-spiral-${stamp}.json`);

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
  if (ext === '.webp') return 'image/webp';
  throw new Error(`Unsupported reference extension: ${ext}`);
}

function toDataUri(file) {
  const mime = mimeFromExt(file);
  const b64 = fs.readFileSync(file).toString('base64');
  return `data:${mime};base64,${b64}`;
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${JSON.stringify(data).slice(0, 1500)}`);
  }
  return data;
}

async function main() {
  loadEnv(envPath);
  const falKey = process.env.FAL_KEY;
  if (!falKey) throw new Error('FAL_KEY missing');
  fs.mkdirSync(outDir, { recursive: true });

  const prompt = fs.readFileSync(promptPath, 'utf8').trim();
  const imageDataUri = toDataUri(refPath);
  const input = {
    prompt,
    image_urls: [imageDataUri],
    num_images: 1,
    aspect_ratio: '4:3',
    output_format: 'png',
    resolution: '1K',
    safety_tolerance: '4',
    limit_generations: true,
    sync_mode: false
  };

  const submit = await fetchJson('https://fal.run/fal-ai/nano-banana-pro/edit', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(input)
  });

  let data = submit;
  let requestId = submit.request_id || submit.requestId || null;

  if (!data.images && requestId) {
    data = await fetchJson(`https://fal.run/fal-ai/nano-banana-pro/edit/requests/${requestId}/result`, {
      headers: {
        'Authorization': `Key ${falKey}`,
        'Accept': 'application/json'
      }
    });
  }

  if (!data.images || !data.images[0]?.url) {
    throw new Error(`No image URL in response: ${JSON.stringify(data).slice(0, 2000)}`);
  }

  const imageUrl = data.images[0].url;
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error(`Failed to download image: ${imageRes.status} ${imageRes.statusText}`);
  const buffer = Buffer.from(await imageRes.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
  fs.writeFileSync(metaPath, JSON.stringify({ requestId, input, response: data, saved: outPath }, null, 2));
  console.log(JSON.stringify({ ok: true, requestId, outPath, metaPath, imageUrl }, null, 2));
}

main().catch((err) => {
  console.error(err.stack || String(err));
  process.exit(1);
});
