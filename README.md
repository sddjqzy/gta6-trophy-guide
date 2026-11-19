[![make.fun](https://img.shields.io/badge/made%20for-make.fun-ff5da2)](https://make.fun)
[![GTA VI](https://img.shields.io/badge/game-Grand%20Theft%20Auto%20VI-37e0c8)](https://www.rockstargames.com/VI)
[![Trophies](https://img.shields.io/badge/trophies-55%20%E2%80%A2%201%20platinum-ffc857)](https://make.fun/c/gta6-trophy-guide-01)

# The Complete GTA VI Trophy Guide

An offline guide and tracker for all **55 Grand Theft Auto VI trophies** on PlayStation 5 — 1 platinum, 2 gold, 6 silver and 46 bronze. Every trophy has its official name, description and grade, a guide written for this page, and a source line saying where each fact comes from.

## What it does

- **Trophy list** — all 55 trophies with their official descriptions, grades, difficulty and roadmap stage.
- **Guides** — every trophy has a how-to in plain words, step by step, with its source cited beside it. Nothing is copied from another guide.
- **Tracker** — tick trophies off as you earn them; progress is saved in the browser (localStorage) and can be exported to a file and imported back.
- **Filters** — search by name or keyword, filter by grade and kind (story, missions, collectibles, activities, exploration, combat, money), show missable trophies only, or hide the ones you have earned.
- **Spoiler-safe mode** — on by default: story trophy names and descriptions stay hidden until you earn them.
- **Roadmap to the platinum** — five stages in order, from the story run to the combat clean-up, ending with the 100% completion gold.
- **Missable flags** — 16 trophies tied to one mission, moment or choice, flagged so you can do them on your first run.

## Run it

No build step, no network, no install. Any static file server works:

```sh
node serve.ts
# then open http://localhost:8080
```

Or serve `app/` with any static host — `app/index.html` is the entry point and every file it loads lives under `app/`.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library. The four screenshots in `screenshots/` are real renders of the app in a desktop browser, taken by its maker — see `shots.json` for which view each one shows.

## Sources

Official trophy names, descriptions, grades and counts come from the PlayStation trophy list as published on PSNProfiles and Exophase. The guides are written for this entry from those descriptions and from community knowledge, cited trophy by trophy in the app's Sources view.

Unofficial fan guide. Grand Theft Auto, GTA and Rockstar Games are trademarks of Take-Two Interactive. No Rockstar logo, artwork or game screenshot is used here.

---

Built for the [GTA 6 trophy guide bounty on make.fun](https://make.fun/r/663520p3).
