import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024,
    files: 1,
  },
});
const port = Number(process.env.PORT || 8091);
const upstreamBase = process.env.RIZZ_ANALYSIS_UPSTREAM || 'http://127.0.0.1:8089';
const upstreamTimeoutMs = Number(process.env.RIZZ_ANALYSIS_TIMEOUT_MS || 45000);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', async (_req, res) => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const upstream = await fetch(`${upstreamBase}/health`, { signal: controller.signal });
    clearTimeout(timer);
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

function buildFeedback({ clarity, lighting, framing, confidenceSignal, styleSignal, faceCount }) {
  const strengths = [];
  const weaknesses = [];
  const actions = [];

  if (clarity >= 78) strengths.push('The face reads sharply enough to support a stronger first impression.');
  else if (clarity >= 64) {
    weaknesses.push('Clarity is acceptable, but not strong enough to carry a lead slot confidently.');
    actions.push('Test a sharper version of this shot before trusting it as a lead.');
  } else {
    weaknesses.push('Clarity is weak for dating-profile use and costs the photo immediate trust.');
    actions.push('Replace it with a cleaner, sharper photo with stronger facial detail.');
  }

  if (lighting >= 74) strengths.push('Lighting helps the photo feel more intentional and more usable.');
  else if (lighting >= 60) {
    weaknesses.push('Lighting is usable, but it still flattens some of the photo’s impact.');
    actions.push('Try a brighter image with cleaner separation and less dullness.');
  } else {
    weaknesses.push('Lighting is dragging the image down and making the first impression weaker.');
    actions.push('Use a better-lit photo with cleaner exposure on the face.');
  }

  if (framing >= 80) strengths.push('The framing keeps attention where it should be for profile use.');
  else if (faceCount > 1) {
    weaknesses.push('Multiple faces weaken the photo’s lead-photo value and make attention split.');
    actions.push('Use a clearer solo shot if this is competing for a top slot.');
  } else {
    weaknesses.push('The framing is making the photo less immediate than your strongest option should be.');
    actions.push('Use a tighter composition where your face lands faster.');
  }

  if (confidenceSignal >= 75) strengths.push('The facial read gives off stronger first-impression confidence.');
  else {
    weaknesses.push('The expression reads flatter or less confident than it should for a high-performing profile photo.');
    actions.push('Choose a shot with more presence, cleaner eye contact, or stronger facial energy.');
  }

  if (styleSignal >= 72) strengths.push('Presentation signals are strong enough to support better profile positioning.');
  else {
    weaknesses.push('Presentation feels less intentional than the strongest version of your profile should feel.');
    actions.push('Swap in a better-groomed, cleaner, or more composed photo.');
  }

  return {
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    actions: actions.slice(0, 4),
  };
}

function deriveSignals(upstream) {
  const score = Number(upstream?.looksmaxxing?.score || 0);
  const confidence = Number(upstream?.looksmaxxing?.confidence || 0);
  const brightness = Number(upstream?.quality?.brightness || 0);
  const contrast = Number(upstream?.quality?.contrast || 0);
  const blurScore = Number(upstream?.quality?.blurScore || 0);
  const faceCount = Number(upstream?.detection?.faceCount || 0);
  const breakdown = upstream?.looksmaxxing?.breakdown || {};

  const lighting = clamp(Math.round((brightness / 160) * 100 + contrast * 0.18), 1, 99);
  const clarity = clamp(Math.round((blurScore / 6) * 100), 1, 99);
  const framing = faceCount === 1 ? 84 : faceCount > 1 ? 54 : 24;
  const confidenceSignal = clamp(Math.round((Number(breakdown.facialHarmony || 60) * 0.55) + (Number(breakdown.eyes || 60) * 0.45)), 1, 99);
  const styleSignal = clamp(Math.round((Number(breakdown.hairFraming || 60) * 0.4) + (Number(breakdown.skin || 60) * 0.35) + (Number(breakdown.jawline || 60) * 0.25)), 1, 99);
  const leadStrength = clamp(Math.round((clarity * 0.25) + (lighting * 0.2) + (framing * 0.2) + (confidenceSignal * 0.2) + (styleSignal * 0.15)), 1, 99);

  const profileStrength = toProfileStrength(score * 0.35 + leadStrength * 0.4 + clarity * 0.1 + lighting * 0.08 + confidenceSignal * 0.07);
  const feedback = buildFeedback({ clarity, lighting, framing, confidenceSignal, styleSignal, faceCount });

  return {
    profileStrength,
    confidenceLabel: toConfidenceLabel(confidence),
    traits: {
      clarity,
      lighting,
      framing,
      confidence: confidenceSignal,
      style: styleSignal,
      leadStrength,
    },
    strengths: feedback.strengths,
    weaknesses: feedback.weaknesses,
    actions: feedback.actions,
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

  if (!req.file.mimetype?.startsWith('image/')) {
    res.status(400).json({ ok: false, error: 'uploaded file must be an image' });
    return;
  }

  try {
    const form = new FormData();
    form.append('image', new Blob([req.file.buffer], { type: req.file.mimetype || 'application/octet-stream' }), req.file.originalname || 'upload.jpg');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), upstreamTimeoutMs);
    const upstreamRes = await fetch(`${upstreamBase}/analyze`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timer);

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
    const detail = String(error);
    const timedOut = detail.includes('AbortError');
    res.status(timedOut ? 504 : 500).json({
      ok: false,
      error: timedOut ? 'analysis upstream timeout' : 'analysis adapter failure',
      detail,
    });
  }
});

app.use((error, _req, res, _next) => {
  if (error?.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ ok: false, error: 'image too large', detail: 'maximum upload size is 12MB' });
    return;
  }
  res.status(500).json({ ok: false, error: 'unexpected adapter error', detail: String(error) });
});

app.listen(port, () => {
  console.log(`RIZZ MAXX analysis adapter listening on http://127.0.0.1:${port}`);
});
