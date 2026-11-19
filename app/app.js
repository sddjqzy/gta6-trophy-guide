// GTA VI trophy tracker: renders the 55 trophies from data/trophies.json,
// keeps the checklist in localStorage, and filters by grade, kind, text,
// earned state and spoiler-free mode. No network use after the data loads.

const DATA_URL = 'data/trophies.json';
const STORAGE_KEY = 'gta6-trophy-guide-v1';
const DEMO_EARNED = [
  'just-like-paradise',
  'paradise-lost',
  'trust',
  'master-of-none',
  'stick-fiddler',
  'baited-my-tackle',
  'whip-it-good',
  'the-goodtime-state',
  'one-last-thing',
  'catch-me-if-you-can',
];

const listEl = document.getElementById('trophy-list');
const metaEl = document.getElementById('list-meta');
const emptyEl = document.getElementById('empty-state');
const errorEl = document.getElementById('load-error');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind-filter');
const gradeButtons = Array.from(document.querySelectorAll('#grade-filters .grade-btn'));
const spoilerEl = document.getElementById('spoiler-free');
const earnedOnlyEl = document.getElementById('earned-only');
const missableOnlyEl = document.getElementById('missable-only');
const earnedCountEl = document.getElementById('earned-count');
const earnedPctEl = document.getElementById('earned-pct');
const progressFillEl = document.getElementById('progress-fill');
const gradeCountsEl = document.getElementById('grade-counts');
const savedNoteEl = document.getElementById('saved-note');

const params = new URLSearchParams(window.location.search);
if (params.get('spoiler') === 'on') spoilerEl.checked = true;
if (params.get('spoiler') === 'off') spoilerEl.checked = false;

// Deep links for sharing a filtered view: ?kind=story, ?grade=bronze.
const kindParam = params.get('kind');
if (kindParam && [...kindEl.options].some((o) => o.value === kindParam)) kindEl.value = kindParam;
const gradeParam = params.get('grade');
if (gradeParam && gradeButtons.some((b) => b.dataset.grade === gradeParam)) {
  gradeButtons.forEach((b) => {
    const on = b.dataset.grade === gradeParam;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

let trophies = [];
let earned = loadEarned();

// A demo view for screenshots: checks a sample set in memory only, so the
// saved checklist in localStorage is left untouched.
if (params.get('demo') === 'checked') {
  for (const id of DEMO_EARNED) earned.add(id);
}
const paramChecked = params.get('check');
if (paramChecked) {
  for (const id of paramChecked.split(',')) {
    const clean = id.trim();
    if (clean) earned.add(clean);
  }
}

function loadEarned() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id) => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

function saveEarned() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort()));
    savedNoteEl.textContent = 'Saved in this browser.';
    window.clearTimeout(saveEarned.timer);
    saveEarned.timer = window.setTimeout(() => { savedNoteEl.textContent = ''; }, 2000);
  } catch {
    savedNoteEl.textContent = 'Could not save — browser storage is unavailable.';
  }
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function kindLabel(kind) {
  return kind
    .replace('completion', '100% completion')
    .replace('platinum', 'Platinum');
}

function isMasked(trophy) {
  return spoilerEl.checked && trophy.hidden && !earned.has(trophy.id);
}

function trophyMatches(trophy) {
  const grade = document.querySelector('#grade-filters .grade-btn.active').dataset.grade;
  if (grade !== 'all' && trophy.grade !== grade) return false;
  if (kindEl.value !== 'all' && trophy.kind !== kindEl.value) return false;
  if (earnedOnlyEl.checked && !earned.has(trophy.id)) return false;
  if (missableOnlyEl.checked && !trophy.missable) return false;
  const query = searchEl.value.trim().toLowerCase();
  if (query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}

function renderList() {
  listEl.innerHTML = '';
  const shown = trophies.filter(trophyMatches);
  metaEl.textContent = `Showing ${shown.length} of ${trophies.length} trophies.`;
  emptyEl.hidden = shown.length !== 0;

  for (const trophy of shown) {
    const item = document.createElement('li');
    item.className = 'trophy' + (earned.has(trophy.id) ? ' earned' : '') + (trophy.missable ? ' missable' : '');
    // Work out the masked display name first: spoiler-free mode must hide
    // a hidden trophy's real name everywhere, including the checkbox label.
    const masked = isMasked(trophy);
    const displayName = masked ? 'Hidden trophy' : trophy.name;

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(trophy.id);
    box.setAttribute('aria-label', `Mark ${displayName} as earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(trophy.id);
      else earned.delete(trophy.id);
      saveEarned();
      renderProgress();
      renderList();
    });
    item.appendChild(box);

    const body = document.createElement('div');

    const badges = document.createElement('div');
    badges.className = 'badges';
    const gradeBadge = document.createElement('span');
    gradeBadge.className = `badge ${trophy.grade}`;
    gradeBadge.textContent = gradeLabel(trophy.grade);
    badges.appendChild(gradeBadge);
    const kindBadge = document.createElement('span');
    kindBadge.className = 'badge kind';
    kindBadge.textContent = kindLabel(trophy.kind);
    badges.appendChild(kindBadge);
    if (trophy.hidden) {
      const hiddenBadge = document.createElement('span');
      hiddenBadge.className = 'badge hidden-badge';
      hiddenBadge.textContent = 'Hidden';
      badges.appendChild(hiddenBadge);
    }
    if (trophy.missable) {
      const missableBadge = document.createElement('span');
      missableBadge.className = 'badge missable-badge';
      missableBadge.textContent = 'Missable';
      badges.appendChild(missableBadge);
    }
    body.appendChild(badges);

    const name = document.createElement('h3');
    name.className = 'trophy-name';
    name.textContent = displayName;
    body.appendChild(name);

    const desc = document.createElement('p');
    desc.className = 'trophy-desc' + (masked ? ' masked' : '');
    desc.textContent = masked
      ? 'Hidden until you unlock it — turn off spoiler-free mode to reveal it.'
      : trophy.description;
    body.appendChild(desc);

    if (!masked) {
      const guide = document.createElement('p');
      guide.className = 'trophy-guide';
      guide.textContent = trophy.guide;
      body.appendChild(guide);

      const source = document.createElement('p');
      source.className = 'trophy-source';
      source.textContent = `Source: ${trophy.source}`;
      body.appendChild(source);
    }

    item.appendChild(body);
    listEl.appendChild(item);
  }
}

function renderProgress() {
  const total = trophies.length;
  const done = trophies.filter((t) => earned.has(t.id)).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  earnedCountEl.textContent = `${done} / ${total}`;
  earnedPctEl.textContent = `· ${pct}%`;
  progressFillEl.style.width = `${pct}%`;
  const byGrade = {};
  for (const t of trophies) {
    byGrade[t.grade] = byGrade[t.grade] || { done: 0, total: 0 };
    byGrade[t.grade].total += 1;
    if (earned.has(t.id)) byGrade[t.grade].done += 1;
  }
  gradeCountsEl.textContent = ['platinum', 'gold', 'silver', 'bronze']
    .filter((g) => byGrade[g])
    .map((g) => `${gradeLabel(g)} ${byGrade[g].done}/${byGrade[g].total}`)
    .join(' · ');
}

function rerender() {
  renderProgress();
  renderList();
}

gradeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    gradeButtons.forEach((b) => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
    renderList();
  });
});

searchEl.addEventListener('input', renderList);
kindEl.addEventListener('change', renderList);
spoilerEl.addEventListener('change', renderList);
earnedOnlyEl.addEventListener('change', renderList);
missableOnlyEl.addEventListener('change', renderList);

document.getElementById('export-btn').addEventListener('click', () => {
  const blob = new Blob(
    [JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort() }, null, 2)],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gta6-trophy-checklist.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

document.getElementById('import-btn').addEventListener('click', () => {
  document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const ids = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(ids)) throw new Error('bad file');
      const known = new Set(trophies.map((t) => t.id));
      earned = new Set(ids.filter((id) => typeof id === 'string' && known.has(id)));
      saveEarned();
      rerender();
      savedNoteEl.textContent = `Imported ${earned.size} earned trophies.`;
    } catch {
      savedNoteEl.textContent = 'That file is not a checklist export from this guide.';
    }
    event.target.value = '';
  };
  reader.readAsText(file);
});

document.getElementById('reset-btn').addEventListener('click', () => {
  if (!window.confirm('Clear every check in your checklist?')) return;
  earned = new Set();
  saveEarned();
  rerender();
});

fetch(DATA_URL)
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then((data) => {
    trophies = data.trophies || [];
    rerender();
    // Deep links for screenshots and sharing: jump to a section once the
    // list has rendered, so the target sits at its final position.
    const view = params.get('view');
    if (view === 'roadmap') {
      document.getElementById('roadmap').scrollIntoView();
    } else if (view === 'list') {
      document.getElementById('trophy-list-section').scrollIntoView();
    }
  })
  .catch(() => {
    errorEl.hidden = false;
    metaEl.textContent = '';
  });
