function csvEscape(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function authorsToCsv(authors = []) {
  const header = [
    'authorId','authorName','label','fitScore','signalScore','postCount','totalScore','totalComments','karma','isClaimed','isActive','latestPostAt','reason'
  ];
  const rows = authors.map((row) => [
    row.authorId,
    row.authorName,
    row.label,
    row.fitScore,
    row.signalScore,
    row.postCount,
    row.totalScore,
    row.totalComments,
    row.karma,
    row.isClaimed,
    row.isActive,
    row.latestPostAt,
    row.reason,
  ]);
  return [header, ...rows].map((cols) => cols.map(csvEscape).join(',')).join('\n');
}

export function snapshotsToCsv(snapshots = []) {
  const header = ['fetchedAt','postCount','authorCount','topAuthor1','topAuthor2','topAuthor3'];
  const rows = snapshots.map((row) => [
    row.fetchedAt,
    row.postCount,
    row.authorCount,
    row.topAuthors?.[0]?.authorName ?? '',
    row.topAuthors?.[1]?.authorName ?? '',
    row.topAuthors?.[2]?.authorName ?? '',
  ]);
  return [header, ...rows].map((cols) => cols.map(csvEscape).join(',')).join('\n');
}

export function buildGrowthMetrics(intel) {
  const snapshots = intel.snapshots ?? [];
  const authors = intel.authors ?? [];
  const discovery = intel.discovery ?? {};
  const admitCount = authors.filter((row) => row.label === 'admit').length;
  const watchCount = authors.filter((row) => row.label === 'watch').length;
  const rejectCount = authors.filter((row) => row.label === 'reject').length;

  return {
    lastFetchedAt: intel.lastFetchedAt,
    totals: {
      posts: intel.postCount ?? 0,
      authors: intel.authorCount ?? 0,
      admits: admitCount,
      watch: watchCount,
      rejects: rejectCount,
      submolts: (discovery.submolts ?? []).length,
      coveredAuthors: (discovery.coverage ?? []).length,
    },
    timeline: snapshots.map((row) => ({
      fetchedAt: row.fetchedAt,
      postCount: row.postCount,
      authorCount: row.authorCount,
      topAuthors: (row.topAuthors ?? []).slice(0, 3).map((x) => x.authorName),
    })),
  };
}
