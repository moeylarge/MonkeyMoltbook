import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
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
    .map((row) => ({
      ...row,
      avgScorePerPost: row.postCount ? row.totalScore / row.postCount : 0,
      avgCommentsPerPost: row.postCount ? row.totalComments / row.postCount : 0,
      signalScore:
        row.totalScore * 1 +
        row.totalComments * 1.5 +
        row.postCount * 5 +
        (row.isClaimed ? 50 : 0) +
        Math.min(Number(row.karma || 0), 5000) * 0.02,
    }))
    .sort((a, b) => b.signalScore - a.signalScore);
}

export async function persistPublicFeedSnapshot(posts, rankings) {
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
        postCount: row.postCount,
        totalScore: row.totalScore,
        totalComments: row.totalComments,
      })),
    },
  ].slice(-MAX_SNAPSHOTS);

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
      latestPostAt: row.latestPostAt,
      titles: row.titles.slice(0, 8),
      snippets: row.snippets.slice(0, 8),
    })),
    rankings: rankings.slice(0, 50),
    snapshots,
    authorHistory,
  };

  await writeMoltbookStore(next);
  return next;
}
