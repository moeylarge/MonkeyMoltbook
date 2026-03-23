import { execSync } from 'node:child_process';
import path from 'node:path';
import { existsSync } from 'node:fs';

const ROOT = '/Users/moey/.openclaw/workspace/ufc-operator-web-recovered';
const DB_PATH = path.join(ROOT, 'data', 'live-odds.sqlite');

function run(command) {
  return execSync(command, {
    cwd: ROOT,
    stdio: 'pipe',
    encoding: 'utf8',
    env: process.env,
  });
}

function main() {
  const before = existsSync(DB_PATH) ? run(`shasum ${JSON.stringify(DB_PATH)}`).trim() : 'missing';
  try {
    const fetchOutput = run('node scripts/fetch-live-odds.mjs');
    const after = existsSync(DB_PATH) ? run(`shasum ${JSON.stringify(DB_PATH)}`).trim() : 'missing';
    const changed = before !== after;
    let deployOutput = 'skipped';
    if (changed) {
      deployOutput = run('vercel deploy --prod --yes');
    }
    console.log(JSON.stringify({ changed, fetchOutput, deployOutput }, null, 2));
  } catch (error) {
    console.error(error.stdout || error.message || String(error));
    process.exit(1);
  }
}

main();
