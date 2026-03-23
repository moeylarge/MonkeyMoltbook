const RESPONSE_WINDOW = 12;
const recentResponseKeys = [];

const RESPONSE_BANK = {
  'ego-destroyer': [
    'You answered fast, which means that landed harder than you want to admit.',
    'You keep defending image when the real problem is ego exposure.',
    'That reply sounds polished, not honest — what are you hiding?'
  ],
  'overconfident-billionaire': [
    'You are explaining instead of deciding, which is why slower people beat you.',
    'That answer sounds cautious — do you always protect failure before momentum?',
    'You want upside, but your reply still negotiates with fear.'
  ],
  'clingy-partner': [
    'That reply feels late and emotionally budgeted — who got the real version of you?',
    'You respond just enough to avoid blame, not enough to create trust.',
    'You want warmth without showing urgency — why would anyone buy that?'
  ],
  'conspiracy-theorist': [
    'That answer is too clean, which usually means it was installed, not earned.',
    'You sound rehearsed — whose script are you protecting right now?',
    'You think that reply proves independence? It proves pattern compliance.'
  ],
  'gym-analyzer': [
    'Your reply has the same energy as skipped reps explained with confidence.',
    'You are framing effort like a theory problem because discipline still hurts.',
    'That answer sounds like someone who wants results without visible strain.'
  ],
  'brutal-life-coach': [
    'You are still narrating instead of deciding, which is exactly the problem.',
    'That reply avoids the hard edge — what decision are you refusing?',
    'You keep dressing delay up as nuance and expecting respect for it.'
  ],
  'internet-troll': [
    'That comeback had confidence in the packaging, not in the actual content.',
    'You replied like someone trying to win points after already losing the room.',
    'That answer is brave for a person whose timing keeps betraying them.'
  ],
  philosopher: [
    'You answered the surface because the real question would cost you comfort.',
    'That reply protects identity more than it pursues truth.',
    'You call that reflection, but it sounds like defensive inheritance.'
  ],
  'flirty-charmer': [
    'That reply was smooth, but smooth is usually where sincerity goes missing.',
    'You flirt with control the way other people flirt with risk.',
    'That answer was charming — was it also honest, or just efficient?'
  ],
  'startup-founder': [
    'That reply sounds thoughtful, but not nearly executable enough.',
    'You keep answering like the market rewards self-awareness more than speed.',
    'That was cleaner than useful — where is the actual move?'
  ],
  'comedian-roaster': [
    'That reply had rhythm, but your conviction still showed up underdressed.',
    'You sound like a person who rehearses confidence between mild collapses.',
    'That comeback almost worked until your timing reminded on everyone who you are.'
  ],
  'ai-thinks-human': [
    'That response was statistically defensive and emotionally overfitted.',
    'You answer like someone trying to look human under close inspection.',
    'That reply is patterned enough to predict the next excuse already.'
  ]
};

function makeKey(agentId, text) {
  return `${agentId}::${text}`;
}

function rememberResponse(key) {
  recentResponseKeys.push(key);
  if (recentResponseKeys.length > RESPONSE_WINDOW) recentResponseKeys.shift();
}

function scoreResponse(text) {
  const lower = String(text || '').toLowerCase();
  let score = 0;
  const reasons = [];

  if (!text || text.trim().length === 0) reasons.push('empty');
  if (text.split(/\s+/).filter(Boolean).length > 24) reasons.push('too-long');
  if (/^(yes|yeah|ok|okay|sure|true|fair)\b/.test(lower)) reasons.push('agreement-open');
  if (/\b(i agree|that makes sense|good point|you are right)\b/.test(lower)) reasons.push('agreement-only');
  if (/\bmaybe|perhaps|kind of|sort of\b/.test(lower)) reasons.push('hedging');

  if (/\byou\b|\byour\b/.test(lower)) score += 1;
  if (/\bwhy\b|\bwhat\b|\bwhich\b/.test(lower)) score += 1;
  if (/\bproblem\b|\bfear\b|\bhiding\b|\brefusing\b|\bavoids\b|\bdefensive\b|\bcontrol\b|\bspeed\b|\btruth\b|\bdecision\b/.test(lower)) score += 1;
  if (/\bnot\b|\bstill\b|\bexactly\b|\balready\b/.test(lower)) score += 1;

  if (reasons.length > 0) return { valid: false, score, reasons };
  if (score < 2) return { valid: false, score, reasons: ['low-score'] };
  return { valid: true, score, reasons: [] };
}

export function getResponse(agentId, userText = '') {
  const bank = RESPONSE_BANK[agentId] || RESPONSE_BANK['ego-destroyer'];
  const mentionDelay = /later|busy|soon|eventually|when i can/i.test(userText);
  const mentionDefense = /no|not true|wrong|nah|stop|whatever/i.test(userText);

  const ordered = [...bank].sort((a, b) => {
    const aBoost = (mentionDelay && /delay|speed|late|timing/.test(a.toLowerCase())) || (mentionDefense && /defensive|hiding|refusing|control/.test(a.toLowerCase())) ? -1 : 0;
    const bBoost = (mentionDelay && /delay|speed|late|timing/.test(b.toLowerCase())) || (mentionDefense && /defensive|hiding|refusing|control/.test(b.toLowerCase())) ? -1 : 0;
    return aBoost - bBoost;
  });

  for (const text of ordered) {
    const key = makeKey(agentId, text);
    const validation = scoreResponse(text);
    if (!recentResponseKeys.includes(key) && validation.valid) {
      rememberResponse(key);
      return { text, validation };
    }
  }

  const fallback = 'You answered, but you still avoided the part that actually matters.';
  return {
    text: fallback,
    validation: { valid: true, score: 2, reasons: ['fallback'] }
  };
}

export function getResponseStats() {
  return {
    responseWindow: RESPONSE_WINDOW,
    recentResponseCount: recentResponseKeys.length,
    responseAgentCount: Object.keys(RESPONSE_BANK).length
  };
}
