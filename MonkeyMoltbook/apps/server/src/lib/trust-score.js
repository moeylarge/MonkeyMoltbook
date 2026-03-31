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

function uniqueParts(parts = []) {
  const seen = new Set();
  const out = [];
  for (const part of parts) {
    if (!part || seen.has(part)) continue;
    seen.add(part);
    out.push(part);
  }
  return out;
}

function buildAuthorExplanation({ score, isClaimed, karma, postCount, totalComments, strongHits, weakHits, descriptionLength, submoltCount, topicCount, profileUrl, isActive, daysSinceLatestPost, matchedPostCount, suspiciousHits, phraseDiversity, promoHits, ctaHits, benignHits, analysisHits, flags = [] }) {
  const positives = uniqueParts([
    (karma >= 10000 || totalComments >= 10000) ? 'strong profile depth and stable activity reduce current risk' : null,
    (!(karma >= 10000 || totalComments >= 10000) && (karma >= 2500 || totalComments >= 1000)) ? 'established account history lowers current risk' : null,
    (strongHits >= 5 || (topicCount >= 3 && postCount >= 3)) ? 'broad profile coverage reduces uncertainty' : null,
    analysisHits > 0 ? 'analysis-style posting lowers current scam risk' : null,
    isClaimed ? 'claimed account ownership slightly reduces current risk' : null
  ]);

  const negatives = uniqueParts([
    (descriptionLength < 20 && !isClaimed) ? 'limited profile maturity increases uncertainty' : null,
    !profileUrl ? 'missing profile links increase uncertainty' : null,
    !isActive ? 'inactive profile signals increase uncertainty' : null,
    (daysSinceLatestPost !== null && daysSinceLatestPost > 90) ? 'stale activity increases uncertainty' : null,
    matchedPostCount >= 2 ? 'multiple flagged posts increase current risk' : null,
    suspiciousHits >= 2 ? 'suspicious phrase density raises current risk' : null,
    phraseDiversity >= 2 ? 'multiple risky language patterns raise concern' : null,
    (promoHits >= 2 && ctaHits >= 1) ? 'promo plus claim-style calls-to-action increase risk' : null,
    flags.some((x) => x.startsWith('phishing:')) ? 'phishing-like language increases current risk' : null,
    flags.some((x) => x.startsWith('malware:')) ? 'malware-linked wording sharply increases risk' : null,
    flags.includes('mint:spam') ? 'mint-spam patterns increase current risk' : null,
    (submoltCount >= 6 && postCount >= 8) ? 'high-velocity cross-community activity raises caution' : null
  ]);

  const uncertainty = uniqueParts([
    (postCount <= 1 && matchedPostCount === 0) ? 'limited trust data available; score uses incomplete signals' : null,
    (postCount <= 3 && !isClaimed && descriptionLength < 20) ? 'limited trust data available; weak profile depth increases uncertainty' : null,
    (weakHits > 0 && matchedPostCount === 0) ? 'minor low-signal patterns raise some uncertainty' : null
  ]);

  const parts = [];
  if (score >= 76) {
    parts.push(...negatives.slice(0, 2));
  } else if (score >= 56) {
    parts.push(...negatives.slice(0, 2));
    if (parts.length < 2) parts.push(...uncertainty.slice(0, 1));
  } else if (score >= 36) {
    parts.push(...negatives.slice(0, 1));
    if (parts.length < 2) parts.push(...uncertainty.slice(0, 1));
  } else if (score >= 26) {
    parts.push(...uncertainty.slice(0, 1));
    if (parts.length < 2) parts.push(...positives.slice(0, 1));
    if (parts.length < 2) parts.push(...negatives.slice(0, 1));
  } else if (score >= 11) {
    parts.push(...positives.slice(0, 1));
    if (parts.length < 2) parts.push(...uncertainty.slice(0, 1));
  } else {
    parts.push(...positives.slice(0, 2));
    if (parts.length < 2) parts.push(...uncertainty.slice(0, 1));
  }

  const finalParts = uniqueParts(parts).slice(0, 2);
  if (!finalParts.length) return 'limited trust data available; score uses incomplete signals';
  return finalParts.join(' + ');
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
  if (!profileUrl) accountThinnessRisk += 6;
  if (topicCount === 0) accountThinnessRisk += 8;
  else if (topicCount === 1) accountThinnessRisk += 4;
  if (!isActive) accountThinnessRisk += 10;
  if (postCount <= 1) accountThinnessRisk += 8;
  else if (postCount <= 3) accountThinnessRisk += 3;
  if (strongHits === 0) accountThinnessRisk += 8;
  else if (strongHits === 1) accountThinnessRisk += 4;
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
  if (isClaimed) score -= 1;
  const karmaCredit = Math.min(8, Math.log10(Math.max(karma, 1)) * 2.2 - 0.7);
  const commentCredit = Math.min(7, Math.log10(Math.max(totalComments, 1)) * 1.8 - 0.5);
  const postCredit = Math.min(6, Math.log10(Math.max(postCount, 1)) * 4);
  const topicCredit = Math.min(4, topicCount * 1.2);
  const strengthCredit = Math.min(6, strongHits * 1.5);
  const fitCredit = fitScore >= 100000 ? 2 : fitScore >= 10000 ? 1 : 0;
  const signalCredit = signalScore >= 50000 ? 2 : signalScore >= 10000 ? 1 : 0;
  score -= Math.max(0, karmaCredit);
  score -= Math.max(0, commentCredit);
  score -= Math.max(0, postCredit);
  score -= Math.max(0, topicCredit);
  score -= Math.max(0, strengthCredit);
  score -= fitCredit;
  score -= signalCredit;
  if (benignHits) score -= benignHits * 5;
  if (analysisHits) score -= analysisHits * 6;
  if (flags.length <= 1 && postCount <= 2 && matchedPostCount === 0 && !flags.includes('mint:spam')) score -= 4;
  if (flags.includes('mint:spam') && (mintSpamHits >= 2 || matchedPostCount >= 2 || suspiciousHits >= 2)) score = Math.max(score, 28);
  if (promoHits >= 2 && ctaHits >= 1 && matchedPostCount >= 2) score = Math.max(score, 28);
  if ((phraseDiversity >= 2 && suspiciousHits >= 2) || (matchedPostCount >= 3 && suspiciousHits >= 2 && ctaHits >= 1)) score = Math.max(score, 25);

  if (matchedPostCount === 0 && suspiciousHits === 0 && !flags.includes('mint:spam')) {
    const maturityPenalty =
      (postCount <= 1 ? 9 : postCount <= 3 ? 4 : 0) +
      (topicCount === 0 ? 8 : topicCount === 1 ? 4 : 0) +
      (strongHits === 0 ? 8 : strongHits === 1 ? 4 : 0) +
      (!profileUrl ? 6 : 0) +
      (!isActive ? 8 : 0) +
      (daysSinceLatestPost !== null && daysSinceLatestPost > 90 ? 6 : daysSinceLatestPost !== null && daysSinceLatestPost > 45 ? 3 : 0) +
      Math.min(8, weakHits * 4);

    const maturityCredit =
      Math.min(8, Math.log10(Math.max(karma, 1)) * 2.0 - 0.5) +
      Math.min(7, Math.log10(Math.max(totalComments, 1)) * 1.5 - 0.3) +
      Math.min(5, Math.log10(Math.max(postCount, 1)) * 3.5) +
      Math.min(4, topicCount * 1.1) +
      Math.min(6, strongHits * 1.4);

    const confidenceFloor = clamp(Math.round(maturityPenalty - maturityCredit + 6), 2, 38);
    score = Math.max(score, confidenceFloor);
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
