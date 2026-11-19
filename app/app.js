// GTA VI Trophy Guide & Tracker: loads app/data/trophies.json, renders the checklist,
// and keeps earned ticks in localStorage. No network use beyond the app's own files.
const STORE_KEY = 'gta6-trophy-guide-progress-v1';
const listEl = document.getElementById('trophyList');
const searchBox = document.getElementById('searchBox');
const spoilerToggle = document.getElementById('spoilerToggle');
const earnedOnlyBox = document.getElementById('earnedOnly');
const missableOnlyBox = document.getElementById('missableOnly');
const kindFilters = document.getElementById('kindFilters');
const gradeFilter = document.getElementById('gradeFilter');
const emptyMsg = document.getElementById('emptyMsg');
const statusMsg = document.getElementById('statusMsg');

const params = new URLSearchParams(location.search);
let kind = params.get('filter') ?? 'all';
let earned = new Set(loadStoredIds());

// Deep-link pre-earned ids for shared views and screenshots, e.g. ?earned=2,3,28
for (const raw of (params.get('earned') ?? '').split(',')) {
  if (!raw) continue;
  const n = Number(raw);
  if (Number.isInteger(n)) earned.add(n);
}
if (params.get('spoiler') === '1') spoilerToggle.checked = true;
if (params.get('grade')) gradeFilter.value = params.get('grade');

function loadStoredIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved.filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

function saveProgress() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function isHiddenFromViewer(trophy) {
  return spoilerToggle.checked && trophy.hidden && !earned.has(trophy.id);
}

function trophyMatches(trophy) {
  if (kind === 'story' && trophy.kind !== 'story') return false;
  if (kind === 'missable' && !trophy.missable) return false;
  if (kind === 'collectibles' && trophy.kind !== 'collectibles') return false;
  if (kind === 'activities' && trophy.kind !== 'activities') return false;
  if (kind === 'online') return false; // No online trophies exist in the official list.
  if (gradeFilter.value !== 'all' && trophy.grade !== gradeFilter.value) return false;
  if (earnedOnlyBox.checked && !earned.has(trophy.id)) return false;
  if (missableOnlyBox.checked && !trophy.missable) return false;
  const q = searchBox.value.trim().toLowerCase();
  if (q) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function buildCard(trophy) {
  const card = document.createElement('article');
  card.className = 'card' + (earned.has(trophy.id) ? ' earned' : '') + (trophy.missable ? ' missable-card' : '');
  card.dataset.trophyId = String(trophy.id);

  const boxWrap = document.createElement('label');
  boxWrap.className = 'earn-box';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.id);
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(trophy.id);
    else earned.delete(trophy.id);
    saveProgress();
    render();
  });
  boxWrap.append(box);
  card.append(boxWrap);

  const head = document.createElement('div');
  head.className = 'card-head';
  const title = document.createElement('h3');
  title.textContent = isHiddenFromViewer(trophy) ? 'Hidden story trophy — earn it to reveal' : trophy.name;
  if (isHiddenFromViewer(trophy)) title.className = 'hidden-name';
  head.append(title);
  const badge = document.createElement('span');
  badge.className = `badge ${trophy.grade}`;
  badge.textContent = gradeLabel(trophy.grade);
  head.append(badge);
  if (trophy.missable) {
    const miss = document.createElement('span');
    miss.className = 'tag miss';
    miss.textContent = '⚠ MISSABLE';
    head.append(miss);
  }
  const kindTag = document.createElement('span');
  kindTag.className = 'tag';
  kindTag.textContent = trophy.kind === 'platinum' ? 'Platinum' : trophy.kind;
  head.append(kindTag);
  if (trophy.count) {
    const count = document.createElement('span');
    count.className = 'tag';
    count.textContent = `Target: ${trophy.count.toLocaleString('en-US')}`;
    head.append(count);
  }
  card.append(head);

  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = isHiddenFromViewer(trophy)
    ? 'Hidden on PlayStation until earned. Turn spoiler-free mode off to see it.'
    : `“${trophy.description}”`;
  card.append(desc);

  // In spoiler-free mode a hidden trophy's guide stays hidden too: the guide
  // names the mission, which is itself the spoiler.
  if (isHiddenFromViewer(trophy)) {
    const note = document.createElement('p');
    note.className = 'guide hidden-name';
    note.textContent = 'Guide hidden until earned — turn spoiler-free mode off to read it.';
    card.append(note);
    return card;
  }

  const guide = document.createElement('details');
  guide.className = 'guide';
  if (params.get('open') === String(trophy.id) || params.get('expand') === '1') guide.open = true;
  const summary = document.createElement('summary');
  summary.textContent = 'Guide';
  guide.append(summary);
  const guideText = document.createElement('p');
  guideText.textContent = trophy.guide;
  guide.append(guideText);
  const source = document.createElement('p');
  source.className = 'source';
  source.textContent = 'Source: ';
  const link = document.createElement('a');
  link.href = trophy.sourceUrl;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = trophy.source;
  source.append(link);
  guide.append(source);
  card.append(guide);

  return card;
}

function renderProgress(total) {
  const count = earned.size;
  const pct = total ? Math.round((count / total) * 100) : 0;
  document.getElementById('progressCount').textContent = `${count} / ${total} earned`;
  document.getElementById('progressPct').textContent = `${pct}%`;
  document.getElementById('progressFill').style.width = `${pct}%`;
  const byGrade = {};
  for (const t of window.__trophies) if (earned.has(t.id)) byGrade[t.grade] = (byGrade[t.grade] ?? 0) + 1;
  document.getElementById('gradeCount').textContent =
    ['platinum', 'gold', 'silver', 'bronze'].map((g) => `${byGrade[g] ?? 0} ${g}`).join(' · ');
}

function render() {
  const trophies = window.__trophies;
  listEl.replaceChildren();
  let shown = 0;
  for (const t of trophies) {
    if (!trophyMatches(t)) continue;
    listEl.append(buildCard(t));
    shown += 1;
  }
  emptyMsg.hidden = shown !== 0;
  renderProgress(trophies.length);
  for (const btn of kindFilters.querySelectorAll('button')) {
    btn.classList.toggle('active', btn.dataset.kind === kind);
  }
}

function flash(message) {
  statusMsg.textContent = message;
  setTimeout(() => { statusMsg.textContent = ''; }, 4000);
}

const doc = await (await fetch('data/trophies.json')).json();
window.__trophies = doc.trophies;

searchBox.addEventListener('input', render);
spoilerToggle.addEventListener('change', render);
earnedOnlyBox.addEventListener('change', render);
missableOnlyBox.addEventListener('change', render);
gradeFilter.addEventListener('change', render);
kindFilters.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-kind]');
  if (!btn) return;
  kind = btn.dataset.kind;
  render();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: 'GTA VI', earned: [...earned].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
  flash('Progress exported.');
});
document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    earned = new Set(ids.filter((n) => Number.isInteger(n)));
    saveProgress();
    render();
    flash(`Imported ${earned.size} earned trophies.`);
  } catch {
    flash('That file could not be read as progress.');
  }
  event.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Clear all earned ticks?')) return;
  earned = new Set();
  saveProgress();
  render();
  flash('Progress reset.');
});
document.getElementById('expandBtn').addEventListener('click', () => {
  for (const d of listEl.querySelectorAll('details.guide')) d.open = true;
});

render();

// Deep-link scrolling for shared views: ?scrollTo=controls jumps to the
// filters, ?scrollTo=trophy-28 jumps to one trophy's card.
const scrollTarget = params.get('scrollTo');
if (scrollTarget) {
  const target = scrollTarget.startsWith('trophy-')
    ? listEl.querySelector(`[data-trophy-id="${scrollTarget.slice(7)}"]`)
    : document.getElementById(scrollTarget);
  if (target) target.scrollIntoView({ block: 'start' });
}
