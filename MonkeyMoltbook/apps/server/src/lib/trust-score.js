function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function textParts(...parts) {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function extractUrls(text = '') {
  return String(text).match(/https?:\/\/[^\s)]+/gi) || [];
}

function hasRepeatedPattern(text = '') {
  const normalized = String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return false;
  const words = normalized.split(' ');
  const unique = new Set(words);
  return words.length >= 12 && unique.size <= Math.max(4, Math.floor(words.length * 0.45));
}

const RISK_PATTERNS = {
  phishing: [
    'seed phrase', 'wallet connect', 'wallet recovery', 'verify your wallet', 'private key', 'connect wallet to claim', 'enter your wallet', 'verify your account now'
  ],
  malware: [
    'keygen', 'stealer', ' rat ', 'remote access trojan', 'credential dump', 'password dump', 'clipboard drainer', 'wallet drainer', 'malware', 'virus'
  ],
  scam: [
    'guaranteed profit', 'double your money', 'dm for method', 'instant payout', 'risk free', 'guaranteed returns', 'send funds first', 'claim your reward now'
  ],
  urgency: [
    'act now', 'urgent', 'limited spots', 'before it is gone', 'last chance', 'expires today', 'only today', 'final chance'
  ]
};

const BENIGN_PATTERNS = [
  'hackathon',
  'usdchackathon',
  'projectsubmission',
  'free guidance',
  'no agenda',
  'open source',
  'security research',
  'compliance',
  'philosophy'
];

const MINT_SPAM_PATTERNS = [
  'mbc-20',
  'hackai',
  ' mint ',
  '"op":"mint"',
  '"tick":',
  '"amt":',
  'bot farming',
  'bot run',
  'grabbing bot',
  'grabbing hackai',
  'allocation',
  'tokens',
  'mint gpt',
  'daily hackai mint'
];

function collectPhraseFlags(text) {
  const hits = [];
  for (const [type, patterns] of Object.entries(RISK_PATTERNS)) {
    for (const pattern of patterns) {
      if (text.includes(pattern)) hits.push(`${type}:${pattern}`);
    }
  }
  return hits;
}

function benignHitCount(text = '') {
  return BENIGN_PATTERNS.filter((pattern) => text.includes(pattern)).length;
}

function mintSpamHitCount(text = '') {
  return MINT_SPAM_PATTERNS.filter((pattern) => text.includes(pattern)).length;
}

function buildReason(flags = []) {
  const reasons = [];
  if (flags.some((x) => x.startsWith('phishing:'))) reasons.push('phishing-like language');
  if (flags.some((x) => x.startsWith('malware:'))) reasons.push('malware/hack phrasing');
  if (flags.some((x) => x.startsWith('scam:'))) reasons.push('scam-style promo language');
  if (flags.includes('mint:spam')) reasons.push('mint/ticker spam pattern');
  if (flags.includes('links:suspicious')) reasons.push('suspicious outbound links');
  if (flags.includes('links:many')) reasons.push('high outbound link density');
  if (flags.includes('behavior:repetitive')) reasons.push('repetitive promo patterns');
  if (flags.includes('account:thin')) reasons.push('thin account with weak identity depth');
  if (flags.includes('community:risky-density')) reasons.push('high concentration of risky content');
  return reasons.slice(0, 3);
}

export function labelForRisk(score) {
  if (score >= 75) return 'Severe Risk';
  if (score >= 50) return 'High Risk';
  if (score >= 25) return 'Caution';
  return 'Low Risk';
}

export function scorePostRisk(post = {}) {
  const text = textParts(post.title, post.snippet, post.body, post.description);
  const urls = extractUrls(textParts(text, post.url));
  const flags = collectPhraseFlags(text);
  const benignHits = benignHitCount(text);
  const mintSpamHits = mintSpamHitCount(text);
  let languageRisk = 0;
  let linkRisk = 0;
  let duplicationRisk = 0;
  let accountContribution = 0;
  let communityContribution = 0;

  for (const hit of flags) {
    if (hit.startsWith('phishing:')) languageRisk += 20;
    else if (hit.startsWith('malware:')) languageRisk += 18;
    else if (hit.startsWith('scam:')) languageRisk += 14;
    else if (hit.startsWith('urgency:')) languageRisk += 8;
  }

  if (urls.length >= 1) linkRisk += 6;
  if (urls.length >= 3) {
    linkRisk += 10;
    flags.push('links:many');
  }
  if (urls.some((url) => /(bit\.ly|tinyurl|t\.co|cutt\.ly|rebrand\.ly)/i.test(url))) {
    linkRisk += 16;
    flags.push('links:suspicious');
  }
  if (hasRepeatedPattern(text)) {
    duplicationRisk += 14;
    flags.push('behavior:repetitive');
  }
  if (mintSpamHits >= 2) {
    duplicationRisk += 24;
    flags.push('mint:spam');
  } else if (mintSpamHits === 1) {
    duplicationRisk += 10;
    flags.push('mint:spam');
  }

  let score = languageRisk + linkRisk + duplicationRisk + accountContribution + communityContribution;
  if (benignHits) score -= benignHits * 8;
  if (flags.length <= 1 && linkRisk === 0) score -= 10;
  score = clamp(score);
  const reasons = buildReason(flags);

  return {
    riskScore: score,
    riskLabel: labelForRisk(score),
    reasonShort: reasons.join(' + ') || 'no strong risk indicators',
    topSignals: reasons,
    signalBreakdown: {
      languageRisk,
      linkRisk,
      duplicationRisk,
      accountContribution,
      communityContribution,
      flags
    },
    version: 'trust-v1'
  };
}

export function scoreAuthorRisk(author = {}) {
  const text = textParts(author.authorName, author.description, author.reason);
  const flags = collectPhraseFlags(text);
  const benignHits = benignHitCount(text);
  const mintSpamHits = mintSpamHitCount(text);
  let accountThinnessRisk = 0;
  let behaviorRisk = 0;
  let networkRisk = 0;
  let languageRisk = 0;

  const postCount = Number(author.postCount ?? author.observedPosts ?? 0);
  const karma = Number(author.karma ?? 0);
  const descriptionLength = String(author.description || '').trim().length;
  const submoltCount = Array.isArray(author.submolts) ? author.submolts.length : 0;
  const isClaimed = Boolean(author.isClaimed ?? author.is_claimed);

  if (descriptionLength < 20 && postCount > 0 && !isClaimed) {
    accountThinnessRisk += 16;
    flags.push('account:thin');
  }
  if (postCount >= 8 && submoltCount >= 4) behaviorRisk += 14;
  if (postCount >= 12 && karma <= 5) behaviorRisk += 18;
  if (submoltCount >= 6) networkRisk += 10;
  if (mintSpamHits >= 2) {
    behaviorRisk += 34;
    networkRisk += 10;
    flags.push('mint:spam');
  } else if (mintSpamHits === 1) {
    behaviorRisk += 22;
    flags.push('mint:spam');
  }

  for (const hit of flags) {
    if (hit.startsWith('phishing:')) languageRisk += 18;
    else if (hit.startsWith('malware:')) languageRisk += 16;
    else if (hit.startsWith('scam:')) languageRisk += 12;
    else if (hit.startsWith('urgency:')) languageRisk += 6;
  }

  let score = accountThinnessRisk + behaviorRisk + networkRisk + languageRisk;
  if (isClaimed) score -= 6;
  if (karma >= 500) score -= 8;
  if (benignHits) score -= benignHits * 8;
  if (flags.length <= 1 && postCount <= 2 && !flags.includes('mint:spam')) score -= 8;
  if (flags.includes('mint:spam')) score = Math.max(score, 28);
  score = clamp(score);
  const reasons = buildReason(flags);

  return {
    riskScore: score,
    riskLabel: labelForRisk(score),
    reasonShort: reasons.join(' + ') || 'limited risk evidence so far',
    topSignals: reasons,
    signalBreakdown: {
      accountThinnessRisk,
      behaviorRisk,
      networkRisk,
      languageRisk,
      flags
    },
    version: 'trust-v1'
  };
}

export function scoreCommunityRisk(community = {}) {
  const text = textParts(community.name, community.title, community.description, ...(community.sampleTitles || []));
  const flags = collectPhraseFlags(text);
  const benignHits = benignHitCount(text);
  const mintSpamHits = mintSpamHitCount(text);
  let contentRisk = 0;
  let linkRisk = 0;
  let densityRisk = 0;

  for (const hit of flags) {
    if (hit.startsWith('phishing:')) contentRisk += 18;
    else if (hit.startsWith('malware:')) contentRisk += 16;
    else if (hit.startsWith('scam:')) contentRisk += 12;
    else if (hit.startsWith('urgency:')) contentRisk += 6;
  }

  if (extractUrls(text).length >= 2) {
    linkRisk += 14;
    flags.push('links:many');
  }
  if ((community.postCount || 0) >= 20 && hasRepeatedPattern((community.sampleTitles || []).join(' '))) {
    densityRisk += 14;
    flags.push('community:risky-density');
  }
  if (mintSpamHits >= 2) {
    densityRisk += 46;
    flags.push('mint:spam');
  } else if (mintSpamHits === 1) {
    densityRisk += 20;
    flags.push('mint:spam');
  }
  if ((community.postCount || 0) >= 10 && mintSpamHits >= 2) {
    densityRisk += 18;
    flags.push('community:risky-density');
  }

  let score = contentRisk + linkRisk + densityRisk;
  if (benignHits) score -= benignHits * 10;
  if (flags.length <= 1 && (community.postCount || 0) < 5) score -= 12;
  score = clamp(score);
  const reasons = buildReason(flags);

  return {
    riskScore: score,
    riskLabel: labelForRisk(score),
    reasonShort: reasons.join(' + ') || 'low observed community risk so far',
    topSignals: reasons,
    signalBreakdown: {
      contentRisk,
      linkRisk,
      densityRisk,
      flags
    },
    version: 'trust-v1'
  };
}

export function scoreEntityRisk(entityType, entity) {
  if (entityType === 'author') return scoreAuthorRisk(entity);
  if (entityType === 'community' || entityType === 'submolt') return scoreCommunityRisk(entity);
  return scorePostRisk(entity);
}
