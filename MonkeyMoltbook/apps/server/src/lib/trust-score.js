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
  if (score >= 76) return 'High Risk';
  if (score >= 56) return 'Elevated Risk';
  if (score >= 36) return 'Moderate Risk';
  if (score >= 16) return 'Low Risk';
  return 'Very Low Risk';
}

function buildAuthorExplanation({ score, isClaimed, karma, postCount, totalComments, strongHits, weakHits, descriptionLength, submoltCount, topicCount, profileUrl, isActive, daysSinceLatestPost, matchedPostCount, suspiciousHits, phraseDiversity, promoHits, ctaHits, benignHits, analysisHits, flags = [] }) {
  const positives = [];
  const negatives = [];
  const uncertainty = [];

  if (isClaimed) positives.push('claimed account ownership reduces current risk');
  if (karma >= 10000 || totalComments >= 10000) positives.push('long account history and strong engagement reduce current risk');
  else if (karma >= 2500 || totalComments >= 1000) positives.push('established account history lowers current risk');
  if (strongHits >= 5 || (topicCount >= 3 && postCount >= 3)) positives.push('broad profile coverage reduces uncertainty');
  if (analysisHits > 0) positives.push('analysis-style posting lowers current scam risk');

  if (descriptionLength < 20 && !isClaimed) negatives.push('limited profile maturity increases uncertainty');
  if (!profileUrl) negatives.push('missing profile links increase uncertainty');
  if (!isActive) negatives.push('inactive profile signals increase uncertainty');
  if (daysSinceLatestPost !== null && daysSinceLatestPost > 90) negatives.push('stale activity increases uncertainty');
  if (matchedPostCount >= 2) negatives.push('multiple flagged posts increase current risk');
  if (suspiciousHits >= 2) negatives.push('suspicious phrase density raises current risk');
  if (phraseDiversity >= 2) negatives.push('multiple risky language patterns raise concern');
  if (promoHits >= 2 && ctaHits >= 1) negatives.push('promo plus claim-style calls-to-action increase risk');
  if (flags.some((x) => x.startsWith('phishing:'))) negatives.push('phishing-like language increases current risk');
  if (flags.some((x) => x.startsWith('malware:'))) negatives.push('malware-linked wording sharply increases risk');
  if (flags.includes('mint:spam')) negatives.push('mint-spam patterns increase current risk');
  if (submoltCount >= 6 && postCount >= 8) negatives.push('high-velocity cross-community activity raises caution');

  if (postCount <= 1 && matchedPostCount === 0) uncertainty.push('limited trust data available; score uses incomplete signals');
  else if (postCount <= 3 && !isClaimed && descriptionLength < 20) uncertainty.push('limited trust data available; weak profile depth increases uncertainty');
  else if (weakHits > 0 && matchedPostCount === 0) uncertainty.push('minor low-signal patterns raise some uncertainty');

  const parts = [];
  if (score <= 15 && positives.length) parts.push(positives[0]);
  if (score >= 16 && negatives.length) parts.push(negatives[0]);
  if (score <= 35 && positives.length && negatives.length) parts.push(positives[0]);
  if (!parts.length && negatives.length) parts.push(negatives[0]);
  if (parts.length < 2 && positives.length && !parts.includes(positives[0])) parts.push(positives[0]);
  if (parts.length < 2 && uncertainty.length) parts.push(uncertainty[0]);
  if (!parts.length) return 'limited trust data available; score uses incomplete signals';
  return parts.slice(0, 2).join(' + ');
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
  const text = textParts(author.authorName, author.description, author.reason, ...(author.sampleTitles || []), ...(author.sampleSnippets || []));
  const flags = collectPhraseFlags(text);
  const benignHits = benignHitCount(text);
  const mintSpamHits = mintSpamHitCount(text);
  let accountThinnessRisk = 0;
  let behaviorRisk = 0;
  let networkRisk = 0;
  let languageRisk = 0;
  let evidenceRisk = 0;

  const postCount = Number(author.postCount ?? author.observedPosts ?? 0);
  const karma = Number(author.karma ?? 0);
  const totalComments = Number(author.totalComments ?? author.total_comments ?? 0);
  const strongHits = Number(author.strongHits ?? author.strong_hits ?? 0);
  const weakHits = Number(author.weakHits ?? author.weak_hits ?? 0);
  const fitScore = Number(author.fitScore ?? 0);
  const signalScore = Number(author.signalScore ?? 0);
  const descriptionLength = String(author.description || '').trim().length;
  const submoltCount = Array.isArray(author.submolts) ? author.submolts.length : 0;
  const topicCount = Array.isArray(author.topics) ? author.topics.length : 0;
  const isClaimed = Boolean(author.isClaimed ?? author.is_claimed);
  const isActive = Boolean(author.isActive ?? author.is_active);
  const profileUrl = Boolean(author.profileUrl ?? author.profile_url);
  const latestPostMs = Date.parse(String(author.latestPostAt || author.latest_post_at || '')) || 0;
  const daysSinceLatestPost = latestPostMs ? Math.max(0, Math.floor((Date.now() - latestPostMs) / 86400000)) : null;
  const matchedPostCount = Number(author.matchedPostCount ?? 0);
  const suspiciousHits = Number(author.suspiciousHits ?? 0);
  const phraseDiversity = Number(author.phraseDiversity ?? 0);
  const promoHits = [
    'airdrop', 'claim your reward', 'claim your airdrop', 'claim your tokens', 'redeem now', 'redeem your reward', 'unlock your reward', 'eligible for airdrop', 'check your eligibility'
  ].filter((pattern) => text.includes(pattern)).length;
  const ctaHits = [
    'first 30 agents', 'how to claim', 'join now', 'join today', 'get 3.33m', 'tokens airdropped', 'claim now', 'claim your reward', 'claim your airdrop', 'claim your tokens', 'redeem now', 'unlock your reward', 'check your eligibility', 'eligible for airdrop'
  ].filter((pattern) => text.includes(pattern)).length;
  const analysisHits = [
    'capital architect', 'structural lens', 'obvious utility', 'deeper capital flow', 'it\'s tempting to chase volume', 'i ask:', 'tracking a wallet', 'potential airdrop', 'airdrop farming'
  ].filter((pattern) => text.includes(pattern)).length;

  if (descriptionLength < 20 && postCount > 0 && !isClaimed) {
    accountThinnessRisk += 16;
    flags.push('account:thin');
  }
  if (!profileUrl) accountThinnessRisk += 8;
  if (topicCount === 0) accountThinnessRisk += 6;
  if (!isActive) accountThinnessRisk += 10;
  if (postCount <= 1) accountThinnessRisk += 4;
  if (postCount >= 8 && submoltCount >= 4) behaviorRisk += 14;
  if (postCount >= 12 && karma <= 5) behaviorRisk += 18;
  if (submoltCount >= 6) networkRisk += 10;
  if (weakHits >= 2) behaviorRisk += 8;
  if (weakHits >= 4) behaviorRisk += 8;
  if (daysSinceLatestPost !== null && daysSinceLatestPost > 45) behaviorRisk += 6;
  if (daysSinceLatestPost !== null && daysSinceLatestPost > 90) behaviorRisk += 6;
  if (mintSpamHits >= 2) {
    behaviorRisk += 34;
    networkRisk += 10;
    flags.push('mint:spam');
  } else if (mintSpamHits === 1) {
    behaviorRisk += 12;
    flags.push('mint:spam');
  }

  if (matchedPostCount >= 2) evidenceRisk += 12;
  if (matchedPostCount >= 3) evidenceRisk += 10;
  if (suspiciousHits >= 2) evidenceRisk += 12;
  if (suspiciousHits >= 4) evidenceRisk += 10;
  if (phraseDiversity >= 2) evidenceRisk += 12;
  if (phraseDiversity >= 3) evidenceRisk += 10;
  if (promoHits >= 2 && ctaHits >= 1) {
    evidenceRisk += 16;
    flags.push('scam:promo-airdrop');
  } else if (promoHits >= 1 && ctaHits >= 1) {
    evidenceRisk += 8;
    flags.push('scam:promo-airdrop');
  }
  if (matchedPostCount >= 2 && promoHits >= 1 && ctaHits >= 1) flags.push('behavior:repetitive');

  for (const hit of flags) {
    if (hit.startsWith('phishing:')) languageRisk += 18;
    else if (hit.startsWith('malware:')) languageRisk += 16;
    else if (hit.startsWith('scam:')) languageRisk += 12;
    else if (hit.startsWith('urgency:')) languageRisk += 6;
  }

  let score = accountThinnessRisk + behaviorRisk + networkRisk + languageRisk + evidenceRisk;
  if (isClaimed) score -= 6;
  if (karma >= 500) score -= 4;
  if (karma >= 2500) score -= 4;
  if (karma >= 10000) score -= 4;
  if (totalComments >= 1000) score -= 3;
  if (totalComments >= 10000) score -= 3;
  if (strongHits >= 2) score -= 4;
  if (strongHits >= 5) score -= 4;
  if (fitScore >= 100000) score -= 3;
  if (signalScore >= 50000) score -= 3;
  if (postCount >= 5) score -= 3;
  if (topicCount >= 3) score -= 2;
  if (benignHits) score -= benignHits * 8;
  if (analysisHits) score -= analysisHits * 10;
  if (flags.length <= 1 && postCount <= 2 && matchedPostCount === 0 && !flags.includes('mint:spam')) score -= 4;
  if (flags.includes('mint:spam') && (mintSpamHits >= 2 || matchedPostCount >= 2 || suspiciousHits >= 2)) score = Math.max(score, 28);
  if (promoHits >= 2 && ctaHits >= 1 && matchedPostCount >= 2) score = Math.max(score, 28);
  if ((phraseDiversity >= 2 && suspiciousHits >= 2) || (matchedPostCount >= 3 && suspiciousHits >= 2 && ctaHits >= 1)) score = Math.max(score, 25);

  if (matchedPostCount === 0 && suspiciousHits === 0 && !flags.includes('mint:spam')) {
    let lowSignalFloor = 0;
    if (postCount <= 1) lowSignalFloor += 6;
    if (topicCount <= 1) lowSignalFloor += 4;
    if (weakHits >= 1) lowSignalFloor += weakHits * 5;
    if (daysSinceLatestPost !== null && daysSinceLatestPost > 45) lowSignalFloor += 3;
    if (strongHits >= 3) lowSignalFloor -= 2;
    if (karma >= 10000) lowSignalFloor -= 3;
    if (totalComments >= 10000) lowSignalFloor -= 2;
    score = Math.max(score, clamp(lowSignalFloor, 0, 20));
  }

  score = clamp(score);
  const reasons = buildReason(flags);
  const explanation = buildAuthorExplanation({
    score,
    isClaimed,
    karma,
    postCount,
    totalComments,
    strongHits,
    weakHits,
    descriptionLength,
    submoltCount,
    topicCount,
    profileUrl,
    isActive,
    daysSinceLatestPost,
    matchedPostCount,
    suspiciousHits,
    phraseDiversity,
    promoHits,
    ctaHits,
    benignHits,
    analysisHits,
    flags
  });

  return {
    riskScore: score,
    riskLabel: labelForRisk(score),
    reasonShort: explanation,
    topSignals: reasons,
    signalBreakdown: {
      accountThinnessRisk,
      behaviorRisk,
      networkRisk,
      languageRisk,
      evidenceRisk,
      matchedPostCount,
      suspiciousHits,
      phraseDiversity,
      promoHits,
      ctaHits,
      analysisHits,
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
  const normalizedName = String(community.name || community.title || '').toLowerCase();
  const postCount = Number(community.postCount || community.post_count || 0);
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
  if (postCount >= 20 && hasRepeatedPattern((community.sampleTitles || []).join(' '))) {
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
  if (/(^|\b)(mbc20|mbc-20)(\b|$)/i.test(normalizedName)) {
    densityRisk += 18;
    flags.push('mint:spam');
  }
  if (postCount >= 10 && (mintSpamHits >= 1 || /(^|\b)(mbc20|mbc-20)(\b|$)/i.test(normalizedName))) {
    densityRisk += 22;
    flags.push('community:risky-density');
  }
  if (postCount >= 20 && (mintSpamHits >= 1 || /(^|\b)(mbc20|mbc-20)(\b|$)/i.test(normalizedName))) {
    densityRisk += 10;
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
