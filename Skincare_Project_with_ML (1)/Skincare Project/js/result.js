// ─────────────────────────────────────────
//   SKINSCOPE — result.js
// ─────────────────────────────────────────

// Map severity level -> CSS class already defined in result.css
const LEVEL_CLASS = {
  none: 'level-low',
  low: 'level-low',
  moderate: 'level-medium',
  high: 'level-high',
};
const LEVEL_LABEL = { none: 'None', low: 'Low', moderate: 'Moderate', high: 'High' };

// Render the ML backend's result (saved by diagnose.js) into the page
function renderResult() {
  const raw = sessionStorage.getItem('skinAnalysisResult');
  if (!raw) {
    // No analysis on file (e.g. user navigated here directly) — send them back
    document.getElementById('resultSummary').textContent =
      'No analysis found. Please upload a photo on the Diagnose page first.';
    return;
  }

  const result = JSON.parse(raw);

  document.getElementById('scoreNum').textContent = result.score;
  document.getElementById('skinTypeTag').textContent = result.skin_type;

  const highs = result.problems.filter(p => p.level === 'high').map(p => p.name);
  const summary = highs.length
    ? `Your skin shows notable signs of ${highs.join(' and ').toLowerCase()}. We've generated a morning and night routine tailored to your skin type and concerns.`
    : `Your skin looks generally healthy with only minor concerns. Here's a routine tailored to your skin type.`;
  document.getElementById('resultSummary').textContent = summary;

  const grid = document.getElementById('problemsGrid');
  grid.innerHTML = result.problems.map(p => `
    <div class="problem-card">
      <div class="problem-icon">${p.icon}</div>
      <div class="problem-name">${p.name}</div>
      <span class="problem-level ${LEVEL_CLASS[p.level]}">${LEVEL_LABEL[p.level]}</span>
    </div>
  `).join('');

  if (result.routine) {
    renderRoutinePanel('panel-morning', result.routine.morning);
    renderRoutinePanel('panel-night', result.routine.night);
    renderRecommended(result.routine.recommended_products);
  }
}

function renderRoutinePanel(panelId, steps) {
  const panel = document.getElementById(panelId);
  panel.innerHTML = steps.map(s => `
    <div class="routine-step">
      <div class="step-num">${s.num}</div>
      <div class="step-info">
        <div class="step-name">${s.name}</div>
        <div class="step-note">${s.note}</div>
      </div>
      <div class="step-tag"><span class="tag tag-${s.tag || 'blue'}">${s.time}</span></div>
    </div>
  `).join('');
}

function renderRecommended(products) {
  if (!products || !products.length) return;
  document.getElementById('recommendedCard').style.display = 'block';
  document.getElementById('recommendedList').innerHTML = products.map(p => `
    <div class="routine-step">
      <div class="step-info">
        <div class="step-name" style="text-transform:capitalize;">${p.category}</div>
        <div class="step-note">${p.reason}</div>
      </div>
      <div class="step-tag"><a class="btn-outline" href="products.html#${p.category}" style="padding:6px 14px; font-size:12px;">View</a></div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', renderResult);

// Switch between Morning and Night routine tabs
function switchTab(tab, btn) {
  // Hide all panels
  document.querySelectorAll('.routine-panel').forEach(p => p.classList.remove('active'));
  // Remove active from all tab buttons
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  // Show selected panel and activate button
  document.getElementById('panel-' + tab).classList.add('active');
  btn.classList.add('active');
}

// Save routine to localStorage
function saveRoutine() {
  const routine = {
    savedAt: new Date().toLocaleDateString(),
    morning: getMorningSteps(),
    night: getNightSteps()
  };
  localStorage.setItem('savedRoutine', JSON.stringify(routine));
  notify('✅ Routine saved! View it in Routine Tracker.');
}

function getMorningSteps() {
  return [
    'Gentle Foaming Cleanser',
    'Niacinamide Toner',
    'Vitamin C Serum',
    'Oil-Free Moisturizer',
    'SPF 50 Sunscreen'
  ];
}

function getNightSteps() {
  return [
    'Micellar Water / Cleansing Oil',
    'Salicylic Acid Cleanser',
    'Niacinamide Serum',
    'Retinol (2-3x per week)',
    'Night Cream / Sleeping Mask'
  ];
}

// Simulate generating a detailed PDF routine
function generateDetailed() {
  notify('📄 Generating detailed routine PDF... (requires backend)');
}

function notify(msg) {
  const n = document.getElementById('notif');
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 2800);
}