// Assembles the GitHub Pages site into _site/: the static files from site/
// plus the current build from dist/, so the demos always run this repo's code.
import { cp, rm, access, readFile, writeFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';

const out = '_site';
const { version } = JSON.parse(await readFile('package.json', 'utf8'));

try {
  await access('dist/pickle.umd.min.js');
} catch {
  console.error('dist/ is missing. Run `npm run build` first.');
  process.exit(1);
}

await rm(out, { recursive: true, force: true });
await cp('site', out, { recursive: true });
await cp('dist', `${out}/dist`, { recursive: true });

// Keep CDN snippets (pickle-select@x.y.z) in sync with the released version.
for await (const file of glob(`${out}/**/*.html`)) {
  const html = await readFile(file, 'utf8');
  const updated = html.replace(/pickle-select@\d+\.\d+\.\d+/g, `pickle-select@${version}`);
  if (updated !== html) await writeFile(file, updated);
}

console.log(`Site for v${version} assembled in ${out}/`);
