import fs from 'fs/promises';
import path from 'path';

const workspaceRoot = '/Users/moey/.openclaw/workspace';
const source = path.join(workspaceRoot, 'ufc-analytics', 'logs', 'website_bundle.json');
const publicDir = path.join(workspaceRoot, 'ufc-operator-web-recovered', 'public', 'data');
const target = path.join(publicDir, 'website_bundle.json');

async function main() {
  await fs.mkdir(publicDir, { recursive: true });
  const raw = await fs.readFile(source, 'utf8');
  JSON.parse(raw);
  await fs.writeFile(target, raw, 'utf8');
  console.log(JSON.stringify({ copiedFrom: source, copiedTo: target }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
