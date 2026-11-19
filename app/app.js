// GTA VI trophy guide and tracker: list, filters, spoiler mode, roadmap,
// missable flags and a localStorage checklist with export and import.
const STORAGE_KEY = 'gta6-trophy-guide-progress-v1';
const listEl = document.getElementById('trophyList');
const missableEl = document.getElementById('missableList');
const roadmapEl = document.getElementById('roadmapList');
const sourceEl = document.getElementById('sourceList');
const searchBox = document.getElementById('searchBox');
const gradeFilter = document.getElementById('gradeFilter');
const kindFilter = document.getElementById('kindFilter');
const missableOnly = document.getElementById('missableOnly');
const hideEarned = document.getElementById('hideEarned');
const spoilerToggle = document.getElementById('spoilerToggle');
const filterNote = document.getElementById('filterNote');
const spoilerNote = document.getElementById('spoilerNote');
const earnedCount = document.getElementById('earnedCount');
const totalCount = document.getElementById('totalCount');
const progressFill = document.getElementById('progressFill');
const progressNote = document.getElementById('progressNote');
const dialog = document.getElementById('detailDialog');
const detailBody = document.getElementById('detailBody');

const params = new URLSearchParams(location.search);
let earned = new Set(loadStored());
let data = null;

function loadStored() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((n) => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

function saveStored() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
}

function spoilerOn() {
  return spoilerToggle.checked;
}

function isHiddenFromSpoilers(trophy) {
  return spoilerOn() && trophy.hidden && !earned.has(trophy.name);
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function kindLabel(kind) {
  const labels = {
    story: 'Story', mission: 'Missions & strangers', collectible: 'Collectible',
    activity: 'Activity', exploration: 'Exploration', combat: 'Combat & robberies',
    economy: 'Money & property', misc: 'Odd one out',
  };
  return labels[kind] ?? kind;
}

function difficultyLabel(level) {
  return '★'.repeat(level) + '☆'.repeat(5 - level);
}

function trophyCard(trophy) {
  const li = document.createElement('li');
  li.className = `trophy-card grade-${trophy.grade}${earned.has(trophy.name) ? ' earned' : ''}`;
  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'trophy-check';
  check.checked = earned.has(trophy.name);
  check.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  check.addEventListener('change', () => {
    if (check.checked) earned.add(trophy.name);
    else earned.delete(trophy.name);
    saveStored();
    renderAll();
  });
  const main = document.createElement('div');
  const name = document.createElement('h3');
  name.className = 'trophy-name';
  name.textContent = isHiddenFromSpoilers(trophy) ? 'Hidden trophy' : trophy.name;
  if (isHiddenFromSpoilers(trophy)) {
    const mark = document.createElement('span');
    mark.className = 'hidden-mark';
    mark.textContent = ' — hidden until earned';
    name.append(mark);
  }
  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = isHiddenFromSpoilers(trophy)
    ? 'This story trophy stays hidden until you earn it.'
    : trophy.description;
  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  const gradeBadge = document.createElement('span');
  gradeBadge.className = `badge grade-${trophy.grade}`;
  gradeBadge.textContent = gradeLabel(trophy.grade);
  meta.append(gradeBadge);
  const kindBadge = document.createElement('span');
  kindBadge.className = 'badge kind';
  kindBadge.textContent = kindLabel(trophy.kind);
  meta.append(kindBadge);
  if (trophy.missable) {
    const miss = document.createElement('span');
    miss.className = 'badge missable';
    miss.textContent = 'Missable';
    meta.append(miss);
  }
  const guideLink = document.createElement('button');
  guideLink.type = 'button';
  guideLink.className = 'trophy-guide-link';
  guideLink.textContent = 'Read the guide →';
  guideLink.addEventListener('click', () => openDetail(trophy));
  main.append(name, desc, meta, guideLink);
  const side = document.createElement('div');
  side.className = 'trophy-side';
  side.textContent = `Difficulty ${difficultyLabel(trophy.difficulty)}`;
  const stage = document.createElement('span');
  stage.className = 'stage';
  stage.textContent = `Roadmap stage ${trophy.stage}`;
  side.append(stage);
  li.append(check, main, side);
  return li;
}

function trophyMatches(trophy) {
  if (gradeFilter.value !== 'all' && trophy.grade !== gradeFilter.value) return false;
  if (kindFilter.value !== 'all' && trophy.kind !== kindFilter.value) return false;
  if (missableOnly.checked && !trophy.missable) return false;
  if (hideEarned.checked && earned.has(trophy.name)) return false;
  const query = searchBox.value.trim().toLowerCase();
  if (query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.when ?? ''}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}

function renderList() {
  const shown = data.trophies.filter(trophyMatches);
  listEl.replaceChildren(...shown.map(trophyCard));
  filterNote.textContent = shown.length === data.trophies.length
    ? ''
    : `Showing ${shown.length} of ${data.trophies.length} trophies.`;
}

function renderMissable() {
  const missable = data.trophies.filter((t) => t.missable);
  missableEl.replaceChildren(...missable.map(trophyCard));
}

function renderRoadmap() {
  roadmapEl.replaceChildren(...data.roadmap.map((stage) => {
    const li = document.createElement('li');
    li.className = 'roadmap-stage';
    const heading = document.createElement('h3');
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = `Stage ${stage.stage}`;
    heading.append(num, document.createTextNode(stage.title));
    const text = document.createElement('p');
    text.textContent = stage.summary;
    const chips = document.createElement('div');
    chips.className = 'roadmap-trophies';
    for (const id of stage.trophies) {
      const trophy = data.trophies.find((t) => t.id === id);
      if (!trophy) continue;
      const chip = document.createElement('span');
      chip.className = `badge grade-${trophy.grade}${earned.has(trophy.name) ? ' done' : ''}`;
      chip.textContent = `${earned.has(trophy.name) ? '✓ ' : ''}${trophy.name}`;
      chips.append(chip);
    }
    li.append(heading, text, chips);
    return li;
  }));
}

function renderSources() {
  sourceEl.replaceChildren(...data.sources.map((s) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = s.name;
    li.append(strong, document.createTextNode(` — ${s.what}`));
    return li;
  }));
}

function renderProgress() {
  const total = data.trophies.length;
  const count = earned.size;
  earnedCount.textContent = String(count);
  totalCount.textContent = String(total);
  progressFill.style.width = `${Math.round((count / total) * 100)}%`;
  progressNote.textContent = count === 0
    ? 'Your progress is saved in this browser.'
    : count === total
      ? 'Leonida Legend — every trophy earned. The platinum is yours.'
      : `${total - count} trophies to go. The next stage is in the roadmap.`;
}

function renderAll() {
  renderProgress();
  renderList();
  renderMissable();
  renderRoadmap();
}

function openDetail(trophy) {
  detailBody.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'detail-body';
  const heading = document.createElement('h2');
  heading.textContent = trophy.name;
  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = trophy.description;
  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  for (const [text, cls] of [
    [gradeLabel(trophy.grade), `badge grade-${trophy.grade}`],
    [kindLabel(trophy.kind), 'badge kind'],
    ...(trophy.missable ? [['Missable — do it on your first run', 'badge missable']] : []),
  ]) {
    const badge = document.createElement('span');
    badge.className = cls;
    badge.textContent = text;
    meta.append(badge);
  }
  const when = document.createElement('p');
  when.className = 'detail-when';
  when.textContent = `When: ${trophy.when ?? 'Any time.'} Difficulty: ${difficultyLabel(trophy.difficulty)} (roadmap stage ${trophy.stage}).`;
  const guide = document.createElement('p');
  guide.textContent = trophy.guide;
  const stepsHeading = document.createElement('h3');
  stepsHeading.textContent = 'Steps';
  const steps = document.createElement('ol');
  for (const step of trophy.steps) {
    const li = document.createElement('li');
    li.textContent = step;
    steps.append(li);
  }
  const source = document.createElement('p');
  source.className = 'detail-source';
  source.textContent = `Source: ${trophy.source}`;
  wrap.append(heading, desc, meta, when, guide, stepsHeading, steps, source);
  detailBody.append(wrap);
  dialog.showModal();
}

// Clicking the backdrop closes the guide, so a reader never hunts for the ✕.
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

function showView(name) {
  for (const button of document.querySelectorAll('.view-tabs button')) {
    button.classList.toggle('active', button.dataset.view === name);
  }
  for (const section of document.querySelectorAll('.view')) {
    section.hidden = section.id !== `view-${name}`;
  }
  history.replaceState(null, '', `#${name}`);
}

function bindControls() {
  for (const button of document.querySelectorAll('.view-tabs button')) {
    button.addEventListener('click', () => showView(button.dataset.view));
  }
  for (const control of [searchBox, gradeFilter, kindFilter, missableOnly, hideEarned, spoilerToggle]) {
    control.addEventListener('input', renderAll);
  }
  spoilerToggle.addEventListener('change', () => {
    spoilerNote.textContent = spoilerOn()
      ? 'Spoiler-safe mode is on: story trophy names and descriptions stay hidden until you earn them. Turn it off to see everything.'
      : 'Spoiler-safe mode is off: every trophy name and description is visible.';
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ game: data.game, earned: [...earned] }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'gta6-trophy-progress.json';
    link.click();
    URL.revokeObjectURL(link.href);
  });
  document.getElementById('importFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      const names = Array.isArray(imported) ? imported : imported.earned;
      if (!Array.isArray(names)) throw new Error('no list');
      earned = new Set(names.filter((n) => data.trophies.some((t) => t.name === n)));
      saveStored();
      renderAll();
    } catch {
      progressNote.textContent = 'That file could not be imported — it needs a list of trophy names.';
    }
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Clear all earned trophies?')) {
      earned = new Set();
      saveStored();
      renderAll();
    }
  });
}

async function boot() {
  const response = await fetch('data/trophies.json');
  data = await response.json();
  // Screenshot helper: ?preset=progress ticks a sample of trophies in memory
  // only, so the tracker view can be photographed without saved progress.
  if (params.get('preset') === 'progress') {
    for (const name of ['Just Like Paradise', 'Paradise Lost', 'T**s Ass Drug Money', 'Vice City, Baby!', 'Top Of The World, Ma', 'Trust', 'Break the Bank', 'Master of None', 'Stick Fiddler', 'Whip It Good', 'In The Beginning…', 'Treat Yo Self']) {
      earned.add(name);
    }
  }
  bindControls();
  renderSources();
  renderAll();
  const view = params.get('view') ?? location.hash.replace('#', '');
  if (['roadmap', 'missable', 'sources'].includes(view)) showView(view);
  if (params.get('spoilers') === 'off') {
    spoilerToggle.checked = false;
    spoilerNote.textContent = 'Spoiler-safe mode is off: every trophy name and description is visible.';
    renderAll();
  }
  const openId = Number(params.get('open'));
  if (openId) {
    const trophy = data.trophies.find((t) => t.id === openId);
    if (trophy) openDetail(trophy);
  }
}

boot();
