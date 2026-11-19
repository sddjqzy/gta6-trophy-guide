// GTA VI trophy guide entry (Node 22, standard library only).
//
// What this program does: it takes the finished guide — the static files in app/
// (index.html, style.css, app.js and data/trophies.json, no build step, no network
// at run time) plus the screenshots/ folder — and hands them in as /output.
// It writes /output/dossier.json with the vendored make.fun library, which is
// the summary the judge reads. vendor/makefun-frontend.ts stays untouched: the
// scorer rebuilds the dossier with its own copy and the two must match byte
// for byte, so this program must not edit, filter or reorder anything.
//
// Local check, outside the grader:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Run it twice and compare the outputs — both runs must write identical bytes.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The repository root is the folder this file lives in; /output is replaced by
// MAKEFUN_OUTPUT_DIR when the grader is not running this program.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps below mirror the scorer's gate: at most 4 screenshots of 256 KiB,
// app/ at most 993 files and 48 MiB, and the dossier text capped at 160 KiB.
// buildDossier refuses anything over those limits instead of writing a bad entry.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
