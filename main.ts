// Hands the GTA VI trophy guide in: copies this repository's app/ and
// screenshots/ into the output directory and writes dossier.json there with
// the vendored make.fun library, so the judge can read the entry.
//
// Runs on Node 22 with the standard library only, no network, and it must
// finish in 10 seconds. Outside the grader, MAKEFUN_OUTPUT_DIR stands in
// for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The output directory is emptied entry by entry, never removed itself: the
// grader mounts it as a bind mount, and removing a mount point fails with
// EBUSY. So: create it, list what is inside it, and delete each child.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function emptyDirectorySafely(dir) {
  mkdirSync(dir, { recursive: true });
  for (const child of readdirSync(dir)) {
    rmSync(join(dir, child), { recursive: true, force: true });
  }
}

emptyDirectorySafely(outDir);
if (!existsSync(join(here, 'app'))) {
  throw new Error('app/ is missing from the repository — nothing to hand in');
}
cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The caps match the gate: at most 4 screenshots of 256 KiB, at most 993
// files and 48 MiB under app/, and a dossier text of at most 160 KiB.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

console.log(`Wrote the GTA VI trophy guide to ${outDir}`);
