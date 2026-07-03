// ─────────────────────────────────────────
//   SKINSCOPE — routine.js
// ─────────────────────────────────────────

// Track step counts
const stepCounts = { morning: 0, night: 0 };
const totalSteps = { morning: 5, night: 5 };

// Switch between morning and night tabs
function switchRoutine(panel, btn) {
  document.querySelectorAll('.routine-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.routine-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + panel).classList.add('active');
  btn.classList.add('active');
  updateProgressUI();
}

// Toggle a single checklist step
function toggleStep(item) {
  item.classList.toggle('done');

  // Determine which panel this step belongs to
  const panel = item.closest('.routine-panel');
  const isNight = panel.id === 'panel-night';
  const key = isNight ? 'night' : 'morning';

  const done = panel.querySelectorAll('.checklist-item.done').length;
  stepCounts[key] = done;

  updateProgressUI();
  saveProgress();

  if (done === totalSteps[key]) {
    notify(`🎉 ${key === 'morning' ? 'Morning' : 'Night'} routine complete!`);
    updateTodayDot();
  }
}

// Mark all steps in current tab as done
function markAllDone(panel) {
  const items = document.querySelectorAll(`#panel-${panel} .checklist-item`);
  items.forEach(item => item.classList.add('done'));
  stepCounts[panel] = totalSteps[panel];
  updateProgressUI();
  saveProgress();
  notify(`✅ All ${panel} steps marked as done!`);
  updateTodayDot();
}

// Reset all steps in current tab
function resetRoutine(panel) {
  const items = document.querySelectorAll(`#panel-${panel} .checklist-item`);
  items.forEach(item => item.classList.remove('done'));
  stepCounts[panel] = 0;
  updateProgressUI();
  saveProgress();
  notify(`↺ ${panel === 'morning' ? 'Morning' : 'Night'} routine reset`);
}

// Update donut chart and stat counters
function updateProgressUI() {
  const totalDone  = stepCounts.morning + stepCounts.night;
  const totalAll   = totalSteps.morning + totalSteps.night;
  const pct        = Math.round((totalDone / totalAll) * 100);

  // Donut
  const circumference = 2 * Math.PI * 38; // r=38
  const dashArray = (pct / 100) * circumference;
  const circle = document.getElementById('donutCircle');
  if (circle) circle.setAttribute('stroke-dasharray', `${dashArray} ${circumference}`);

  const pctEl = document.getElementById('donutPct');
  if (pctEl) pctEl.textContent = pct + '%';

  // AM/PM counters
  const amEl = document.getElementById('amProgress');
  const pmEl = document.getElementById('pmProgress');
  if (amEl) amEl.textContent = `${stepCounts.morning} / ${totalSteps.morning}`;
  if (pmEl) pmEl.textContent = `${stepCounts.night} / ${totalSteps.night}`;
}

// Mark today's dot as done if both routines are complete
function updateTodayDot() {
  if (stepCounts.morning === totalSteps.morning && stepCounts.night === totalSteps.night) {
    const todayDot = document.getElementById('todayDot');
    if (todayDot) {
      todayDot.textContent = '✓';
      todayDot.classList.remove('today');
      todayDot.classList.add('done');
    }
    document.getElementById('weekCount').textContent = '5 / 7';
  }
}

// Save progress to localStorage
function saveProgress() {
  const state = {
    morning: [...document.querySelectorAll('#panel-morning .checklist-item')].map(i => i.classList.contains('done')),
    night:   [...document.querySelectorAll('#panel-night .checklist-item')].map(i => i.classList.contains('done')),
    date: new Date().toLocaleDateString()
  };
  localStorage.setItem('routineProgress', JSON.stringify(state));
}

// Restore progress from localStorage
function restoreProgress() {
  const saved = JSON.parse(localStorage.getItem('routineProgress'));
  if (!saved || saved.date !== new Date().toLocaleDateString()) return;

  const morningItems = document.querySelectorAll('#panel-morning .checklist-item');
  const nightItems   = document.querySelectorAll('#panel-night .checklist-item');

  saved.morning.forEach((done, i) => {
    if (done && morningItems[i]) {
      morningItems[i].classList.add('done');
      stepCounts.morning++;
    }
  });

  saved.night.forEach((done, i) => {
    if (done && nightItems[i]) {
      nightItems[i].classList.add('done');
      stepCounts.night++;
    }
  });

  updateProgressUI();
}

// View history (placeholder)
function viewHistory() {
  notify('📊 Full history chart — coming soon!');
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  restoreProgress();
  updateProgressUI();
});

function notify(msg) {
  const n = document.getElementById('notif');
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 2800);
}