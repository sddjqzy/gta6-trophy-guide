// GTA VI trophy guide — build entrypoint.
//
// Copies the static app (app/) and its screenshots (screenshots/) into the
// output directory, then writes dossier.json for that directory by calling
// the make.fun frontend library. Node's standard library only, no build
// step: run it with `node main.ts`.
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The output directory defaults to /output. Running the script twice over
// the same inputs produces byte-identical outputs: the copies are plain
// file copies, nothing carries a timestamp, and the dossier is canonical
// JSON, so a rebuild can be diffed against the previous one to prove it.

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The folder this file lives in is the repository root: app/ and
// screenshots/ sit next to it.
const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The caps the bounty scores against: the text budget for the dossier, at
// most four screenshots of at most 256 KiB each, and the app size limits.
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

// Start from an empty output directory so a stale file from an earlier run
// can never survive into the new build.
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

// Copy the two trees the dossier is built from.
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });

// Build the dossier from the copied trees and write it next to them.
const dossier = buildDossier(outputDir, caps);
writeFileSync(join(outputDir, 'dossier.json'), dossier);

console.log(`Wrote ${join(outputDir, 'dossier.json')} (${dossier.length} bytes).`);
