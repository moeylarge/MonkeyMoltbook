import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = Number(process.env.PORT || 8091);
const upstreamBase = process.env.RIZZ_ANALYSIS_UPSTREAM || 'http://127.0.0.1:8089';

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', async (_req, res) => {
  try {
    const upstream = await fetch(`${upstreamBase}/health`);
    const upstreamJson = await upstream.json();
    res.json({ ok: true, service: 'rizz-maxx-analysis-adapter', upstream: upstreamJson });
  } catch (error) {
    res.status(503).json({ ok: false, service: 'rizz-maxx-analysis-adapter', error: String(error) });
  }
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toConfidenceLabel(value) {
  if (value >= 85) return 'High';
  if (value >= 65) return 'Medium';
  return 'Low';
}

function toProfileStrength(raw) {
  return clamp(Math.round(raw), 1, 99);
}

function deriveSignals(upstream) {
  const score = Number(upstream?.looksmaxxing?.score || 0);
  const confidence = Number(upstream?.looksmaxxing?.confidence || 0);
  const brightness = Number(upstream?.quality?.brightness || 0);
  const contrast = Number(upstream?.quality?.contrast || 0);
  const blurScore = Number(upstream?.quality?.blurScore || 0);
  const faceCount = Number(upstream?.detection?.faceCount || 0);
  const breakdown = upstream?.looksmaxxing?.breakdown || {};

  const lighting = clamp(Math.round((brightness / 160) * 100), 1, 99);
  const clarity = clamp(Math.round((blurScore / 6) * 100), 1, 99);
  const framing = faceCount === 1 ? 82 : faceCount > 1 ? 58 : 25;
  const confidenceSignal = clamp(Math.round(((Number(breakdown.facialHarmony || 60) + Number(breakdown.eyes || 60)) / 2)), 1, 99);
  const styleSignal = clamp(Math.round((Number(breakdown.hairFraming || 60) + Number(breakdown.skin || 60)) / 2), 1, 99);

  const profileStrength = toProfileStrength(score * 0.55 + clarity * 0.15 + lighting * 0.1 + confidenceSignal * 0.1 + styleSignal * 0.1);

  const strengths = [];
  const weaknesses = [];
  const actions = [];

  if (clarity >= 70) strengths.push('The face reads clearly enough to support a stronger first impression.');
  else {
    weaknesses.push('Clarity is weaker than it should be for a lead-photo candidate.');
    actions.push('Use a sharper photo with cleaner detail and less softness.');
  }

  if (lighting >= 68) strengths.push('Lighting is good enough to help the photo feel more intentional.');
  else {
    weaknesses.push('The lighting is flattening the photo and costing you impact.');
    actions.push('Replace it with a brighter image that gives your face cleaner separation.');
  }

  if (framing >= 75) strengths.push('The framing keeps the photo focused enough for profile use.');
  else {
    weaknesses.push('The framing is making the photo feel less usable as a dating-profile asset.');
    actions.push('Use a tighter composition where your face is easier to read immediately.');
  }

  if (confidenceSignal >= 72) strengths.push('The expression and facial read suggest better first-impression confidence.');
  else {
    weaknesses.push('The expression reads flatter or less confident than your strongest possible lead.');
    actions.push('Choose a shot with more presence, cleaner eye contact, or stronger facial energy.');
  }

  if (styleSignal < 68) {
    weaknesses.push('Overall presentation feels less intentional than it needs to.');
    actions.push('Swap in a better-groomed, cleaner, or more composed photo.');
  } else {
    strengths.push('Presentation signals are strong enough to support better profile positioning.');
  }

  if (!actions.length) {
    actions.push('Keep this photo in the set and compare it against stronger alternatives before locking the order.');
  }

  return {
    profileStrength,
    confidenceLabel: toConfidenceLabel(confidence),
    traits: {
      clarity,
      lighting,
      framing,
      confidence: confidenceSignal,
      style: styleSignal,
    },
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    actions: actions.slice(0, 3),
    upstreamSummary: {
      confidence,
      faceCount,
      upstreamScore: score,
    },
  };
}

app.post('/v1/analyze-photo', upload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ ok: false, error: 'image file is required' });
    return;
  }

  try {
    const form = new FormData();
    form.append('image', new Blob([req.file.buffer], { type: req.file.mimetype || 'application/octet-stream' }), req.file.originalname || 'upload.jpg');

    const upstreamRes = await fetch(`${upstreamBase}/analyze`, {
      method: 'POST',
      body: form,
    });

    if (!upstreamRes.ok) {
      const text = await upstreamRes.text();
      res.status(502).json({ ok: false, error: 'upstream analysis failed', detail: text.slice(0, 500) });
      return;
    }

    const upstream = await upstreamRes.json();
    const mapped = deriveSignals(upstream);

    res.json({
      ok: true,
      profileStrength: mapped.profileStrength,
      confidenceLabel: mapped.confidenceLabel,
      traits: mapped.traits,
      strengths: mapped.strengths,
      weaknesses: mapped.weaknesses,
      actions: mapped.actions,
      upstreamSummary: mapped.upstreamSummary,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'analysis adapter failure', detail: String(error) });
  }
});

app.listen(port, () => {
  console.log(`RIZZ MAXX analysis adapter listening on http://127.0.0.1:${port}`);
});
