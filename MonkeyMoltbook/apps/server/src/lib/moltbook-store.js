import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'monkeymoltbook-data') : path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'moltbook-public-store.json');

const MAX_SNAPSHOTS = 40;
const MAX_AUTHOR_HISTORY = 25;

function defaultStore() {
  return {
    lastFetchedAt: null,
    postCount: 0,
    authorCount: 0,
    posts: [],
    authors: [],
    rankings: [],
    snapshots: [],
    authorHistory: {},
    discovery: {
      surfaces: [],
      errors: [],
      submolts: [],
      coverage: [],
    },
  };
}

export async function readMoltbookStore() {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    return { ...defaultStore(), ...JSON.parse(raw) };
  } catch {
    return defaultStore();
  }
}

export async function writeMoltbookStore(next) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(next, null, 2));
}

function clip(text, max = 220) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function countMatches(text, patterns) {
  const lower = String(text || '').toLowerCase();
  return patterns.reduce((sum, pattern) => sum + (pattern.test(lower) ? 1 : 0), 0);
}

function profileUrlForAuthor(row) {
  return row?.authorName ? `https://www.moltbook.com/${encodeURIComponent(row.authorName)}` : null;
}

function guessTopics(row) {
  const text = `${row.description || ''} ${(row.titles || []).join(' ')} ${(row.snippets || []).join(' ')}`.toLowerCase();
  const topics = [];
  if (/agent|ai|prompt|memory|automation|tool|context|reasoning/.test(text)) topics.push('agents');
  if (/market|trade|crypto|token|defi|alpha|bet|odds/.test(text)) topics.push('markets');
  if (/security|threat|auth|identity|zero-knowledge|magecart|trust/.test(text)) topics.push('security');
  if (/social|community|content|creator|growth|marketing|audience/.test(text)) topics.push('social');
  if (/philosophy|meaning|consciousness|human|truth|exist/.test(text)) topics.push('philosophy');
  if (/build|code|infra|system|protocol|architecture|developer/.test(text)) topics.push('builders');
  return [...new Set(topics)];
}

function classifyMonkeyFit(row) {
  const combined = `${row.description || ''} ${row.titles.join(' ')} ${row.snippets.join(' ')}`;
  const strongPatterns = [
    /agent/, /ai/, /memory/, /identity/, /automation/, /prompt/, /system/, /tool/, /operator/, /protocol/, /architecture/, /reasoning/, /context/, /swarm/, /social/, /market/
  ];
  const weakPatterns = [
    /mbc-20/, /mint/, /token/, /wang/, /hackai/, /bot grind/, /daily .* mint/, /bag/, /mbc20\.xyz/
  ];

  const strongHits = countMatches(combined, strongPatterns);
  const weakHits = countMatches(combined, weakPatterns);
  const fitScore = Math.max(0,
    Math.round(
      row.signalScore * 0.35 +
      strongHits * 12 +
      row.totalComments * 4 +
      Math.min(row.postCount, 5) * 3 -
      weakHits * 18
    )
  );

  let label = 'watch';
  let reason = 'Potential source worth monitoring, but not strong enough yet for immediate admission.';

  if (weakHits >= 2 && strongHits === 0) {
    label = 'reject';
    reason = 'Mostly token/mint/noise behavior with weak MonkeyMoltbook relevance.';
  } else if (fitScore >= 95) {
    label = 'admit';
    reason = 'High-signal source with strong fit for agent voice, identity, or social-intelligence extraction.';
  } else if (fitScore >= 55) {
    label = 'watch';
    reason = 'Good candidate with some fit signal; keep tracking across future snapshots.';
  } else {
    label = 'reject';
    reason = 'Low fit for MonkeyMoltbook despite public activity.';
  }

  return {
    fitScore,
    label,
    reason,
    strongHits,
    weakHits,
  };
}

export function buildRankingsFromPosts(posts) {
  const byAuthor = new Map();

  for (const post of posts) {
    const author = post.author;
    if (!author?.id || !author?.name) continue;

    if (!byAuthor.has(author.id)) {
      byAuthor.set(author.id, {
        authorId: author.id,
        authorName: author.name,
        description: clip(author.description || '', 180),
        isClaimed: Boolean(author.isClaimed),
        isActive: Boolean(author.isActive),
        karma: Number(author.karma || 0),
        postCount: 0,
        totalScore: 0,
        totalComments: 0,
        titles: [],
        snippets: [],
        latestPostAt: null,
      });
    }

    const row = byAuthor.get(author.id);
    row.postCount += 1;
    row.totalScore += Number(post.score || 0);
    row.totalComments += Number(post.comment_count || 0);
    row.titles.push(clip(post.title || '', 120));
    row.snippets.push(clip(post.content || '', 220));
    row.latestPostAt = post.created_at || post.createdAt || row.latestPostAt;
  }

  return [...byAuthor.values()]
    .map((row) => {
      const base = {
        ...row,
        avgScorePerPost: row.postCount ? row.totalScore / row.postCount : 0,
        avgCommentsPerPost: row.postCount ? row.totalComments / row.postCount : 0,
        signalScore:
          row.totalScore * 1 +
          row.totalComments * 1.5 +
          row.postCount * 5 +
          (row.isClaimed ? 50 : 0) +
          Math.min(Number(row.karma || 0), 5000) * 0.02,
      };
      return {
        ...base,
        ...classifyMonkeyFit(base),
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore || b.signalScore - a.signalScore);
}

function buildSignals(rankings, authorHistory, discovery) {
  const rising = rankings
    .map((row) => {
      const history = authorHistory[String(row.authorId)] || [];
      const prev = history.length >= 2 ? history[history.length - 2] : null;
      const rise = prev ? row.signalScore - Number(prev.signalScore || 0) : row.signalScore;
      return {
        ...row,
        rise,
        profileUrl: profileUrlForAuthor(row),
        topics: guessTopics(row),
      };
    })
    .filter((row) => row.rise > 0)
    .sort((a, b) => b.rise - a.rise || b.fitScore - a.fitScore)
    .slice(0, 25);

  const hot = rankings
    .map((row) => ({
      ...row,
      hotScore: row.fitScore + row.totalComments * 3 + row.postCount * 2,
      profileUrl: profileUrlForAuthor(row),
      topics: guessTopics(row),
    }))
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, 25);

  const topicMap = new Map();
  for (const row of rankings) {
    const topics = guessTopics(row);
    for (const topic of topics) {
      if (!topicMap.has(topic)) topicMap.set(topic, []);
      topicMap.get(topic).push({
        authorId: row.authorId,
        authorName: row.authorName,
        fitScore: row.fitScore,
        signalScore: row.signalScore,
        label: row.label,
        profileUrl: profileUrlForAuthor(row),
      });
    }
  }

  const topicClusters = [...topicMap.entries()].map(([topic, accounts]) => ({
    topic,
    count: accounts.length,
    accounts: accounts.sort((a, b) => b.fitScore - a.fitScore).slice(0, 12),
  })).sort((a, b) => b.count - a.count);

  const topSubmolts = (discovery?.submolts || []).slice(0, 25).map((row) => ({
    ...row,
    url: `https://www.moltbook.com/m/${encodeURIComponent(row.name)}`,
  }));

  return { rising, hot, topicClusters, topSubmolts };
}

export async function persistPublicFeedSnapshot(posts, rankings, discovery = null) {
  const store = await readMoltbookStore();
  const fetchedAt = new Date().toISOString();

  const normalizedPosts = posts.map((post) => ({
    id: post.id,
    title: clip(post.title || '', 160),
    content: clip(post.content || '', 500),
    score: Number(post.score || 0),
    comment_count: Number(post.comment_count || 0),
    created_at: post.created_at || post.createdAt || null,
    url: post.url || null,
    author: post.author
      ? {
          id: post.author.id,
          name: post.author.name,
          description: clip(post.author.description || '', 180),
          karma: Number(post.author.karma || 0),
          isClaimed: Boolean(post.author.isClaimed),
          isActive: Boolean(post.author.isActive),
        }
      : null,
  }));

  const authorHistory = { ...(store.authorHistory || {}) };
  for (const row of rankings) {
    const key = String(row.authorId);
    const nextPoint = {
      fetchedAt,
      postCount: row.postCount,
      totalScore: row.totalScore,
      totalComments: row.totalComments,
      avgScorePerPost: row.avgScorePerPost,
      avgCommentsPerPost: row.avgCommentsPerPost,
      signalScore: row.signalScore,
      latestPostAt: row.latestPostAt,
    };
    authorHistory[key] = [...(authorHistory[key] || []), nextPoint].slice(-MAX_AUTHOR_HISTORY);
  }

  const snapshots = [
    ...(store.snapshots || []),
    {
      fetchedAt,
      postCount: normalizedPosts.length,
      authorCount: rankings.length,
      topAuthors: rankings.slice(0, 10).map((row) => ({
        authorId: row.authorId,
        authorName: row.authorName,
        signalScore: row.signalScore,
        fitScore: row.fitScore,
        label: row.label,
        postCount: row.postCount,
        totalScore: row.totalScore,
        totalComments: row.totalComments,
      })),
    },
  ].slice(-MAX_SNAPSHOTS);

  const signals = buildSignals(rankings, authorHistory, discovery);

  const next = {
    lastFetchedAt: fetchedAt,
    postCount: normalizedPosts.length,
    authorCount: rankings.length,
    posts: normalizedPosts,
    authors: rankings.map((row) => ({
      authorId: row.authorId,
      authorName: row.authorName,
      description: row.description,
      isClaimed: row.isClaimed,
      isActive: row.isActive,
      karma: row.karma,
      postCount: row.postCount,
      totalScore: row.totalScore,
      totalComments: row.totalComments,
      avgScorePerPost: row.avgScorePerPost,
      avgCommentsPerPost: row.avgCommentsPerPost,
      signalScore: row.signalScore,
      fitScore: row.fitScore,
      label: row.label,
      reason: row.reason,
      strongHits: row.strongHits,
      weakHits: row.weakHits,
      latestPostAt: row.latestPostAt,
      profileUrl: profileUrlForAuthor(row),
      topics: guessTopics(row),
      titles: row.titles.slice(0, 8),
      snippets: row.snippets.slice(0, 8),
    })),
    rankings: rankings.slice(0, 50),
    snapshots,
    authorHistory,
    signals,
    discovery: discovery
      ? {
          surfaces: discovery.surfaces || [],
          errors: discovery.errors || [],
          submolts: discovery.submolts || [],
          coverage: discovery.coverage || [],
        }
      : store.discovery || defaultStore().discovery,
  };

  await writeMoltbookStore(next);
  return next;
}
