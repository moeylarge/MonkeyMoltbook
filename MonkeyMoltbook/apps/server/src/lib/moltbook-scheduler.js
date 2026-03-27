let timer = null;
let intervalMs = null;
let lastRunAt = null;
let lastResult = null;

export function getSchedulerState() {
  return {
    enabled: Boolean(timer),
    intervalMs,
    lastRunAt,
    lastResult,
  };
}

export function startScheduler(task, everyMs = 15 * 60 * 1000) {
  stopScheduler();
  intervalMs = everyMs;
  timer = setInterval(async () => {
    lastRunAt = new Date().toISOString();
    try {
      lastResult = await task();
    } catch (error) {
      lastResult = { ok: false, error: String(error?.message || error) };
    }
  }, everyMs);
  return getSchedulerState();
}

export function stopScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
  intervalMs = null;
}
