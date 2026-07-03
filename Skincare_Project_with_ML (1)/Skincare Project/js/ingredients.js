// ─────────────────────────────────────────
//   SKINSCOPE — ingredients.js
// ─────────────────────────────────────────

// Known ingredient database (simplified)
const INGREDIENT_DB = {
  // Harsh
  'alcohol denat':  { type: 'harsh',    reason: 'Strips natural oils, disrupts skin barrier' },
  'denatured alcohol': { type: 'harsh', reason: 'Drying and irritating, especially for sensitive skin' },
  'fragrance':      { type: 'harsh',    reason: 'Common allergen, causes irritation and sensitization' },
  'parfum':         { type: 'harsh',    reason: 'Synthetic fragrance, a leading cause of contact dermatitis' },
  'sodium lauryl sulfate': { type: 'harsh', reason: 'Harsh surfactant that strips moisture from skin' },
  'sls':            { type: 'harsh',    reason: 'Harsh surfactant that strips moisture from skin' },
  'formaldehyde':   { type: 'harsh',    reason: 'Preservative that causes irritation and is potentially carcinogenic' },

  // Safe
  'niacinamide':    { type: 'safe',     reason: 'Reduces pores, controls oil, brightens skin tone' },
  'hyaluronic acid': { type: 'safe',    reason: 'Deep hydration, plumps skin without clogging pores' },
  'glycerin':       { type: 'safe',     reason: 'Gentle humectant that draws moisture into skin' },
  'ceramides':      { type: 'safe',     reason: 'Restores and strengthens the skin barrier' },
  'zinc pca':       { type: 'safe',     reason: 'Controls sebum production, good for oily skin' },
  'salicylic acid': { type: 'safe',     reason: 'Exfoliates inside pores, effective for acne' },
  'retinol':        { type: 'safe',     reason: 'Promotes cell turnover, reduces fine lines and dark spots' },
  'vitamin c':      { type: 'safe',     reason: 'Antioxidant that brightens and protects skin' },
  'ascorbic acid':  { type: 'safe',     reason: 'Stable form of Vitamin C, brightening and protective' },
  'panthenol':      { type: 'safe',     reason: 'Vitamin B5, soothes and hydrates skin' },
  'allantoin':      { type: 'safe',     reason: 'Calms irritation and promotes healing' },
  'water':          { type: 'safe',     reason: 'Base ingredient, safe for all skin types' },

  // Conflicts (pairs checked separately)
  'benzoyl peroxide': { type: 'conflict', reason: 'Conflicts with retinol — use on alternate days' },
  'aha':            { type: 'conflict',   reason: 'Conflicts with retinol — can cause over-exfoliation' },
  'glycolic acid':  { type: 'conflict',   reason: 'Conflicts with retinol — increases irritation risk' },
  'lactic acid':    { type: 'conflict',   reason: 'Conflicts with Vitamin C — reduces effectiveness' },
  'vitamin e':      { type: 'safe',       reason: 'Antioxidant that pairs well with Vitamin C' },
};

// Alternatives map
const ALTERNATIVES = {
  'alcohol denat':  { to: 'Glycerin or Hyaluronic Acid',   reason: 'Hydrates without stripping skin' },
  'fragrance':      { to: 'Fragrance-Free Formulas',        reason: 'Avoids allergens and sensitization' },
  'parfum':         { to: 'Essential Oil-Free Products',    reason: 'Safer for reactive skin types' },
  'sodium lauryl sulfate': { to: 'Sodium Lauryl Glucoside', reason: 'Gentler surfactant, less irritating' },
  'benzoyl peroxide': { to: 'Niacinamide or Tea Tree Oil',  reason: 'Effective without the drying effect' },
};

const RATING_LABELS = {
  1: 'Poor — not helpful at all',
  2: 'Fair — needs improvement',
  3: 'Good — somewhat helpful',
  4: 'Very Good — mostly helpful',
  5: 'Excellent — very helpful!'
};

// Example ingredient lists
const EXAMPLES = {
  toner: 'Water, Niacinamide, Zinc PCA, Panthenol, Glycerin, Hyaluronic Acid, Alcohol Denat, Fragrance',
  moisturizer: 'Water, Glycerin, Ceramides, Hyaluronic Acid, Allantoin, Panthenol, Sodium Hyaluronate',
  serum: 'Water, Retinol, Ascorbic Acid, Vitamin E, Lactic Acid, Glycolic Acid, Benzoyl Peroxide, Fragrance'
};

function loadExample(type) {
  document.getElementById('ingredientInput').value = EXAMPLES[type];
  notify(`Loaded ${type} example — click Analyze to check it`);
}

function clearAll() {
  document.getElementById('ingredientInput').value = '';
  document.getElementById('resultsContent').style.display = 'none';
  document.getElementById('resultsPlaceholder').style.display = 'block';
}

function analyzeIngredients() {
  const raw = document.getElementById('ingredientInput').value.trim();
  if (!raw) {
    notify('Please paste an ingredient list first');
    return;
  }

  // Parse ingredients
  const items = raw.split(/,|\n/).map(i => i.trim().toLowerCase()).filter(Boolean);

  const harsh    = [];
  const safe     = [];
  const conflicts = [];
  const neutral  = [];
  const alts     = [];

  items.forEach(ing => {
    const match = INGREDIENT_DB[ing];
    if (match) {
      if (match.type === 'harsh')    harsh.push({ name: ing, reason: match.reason });
      else if (match.type === 'safe') safe.push({ name: ing, reason: match.reason });
      else if (match.type === 'conflict') conflicts.push({ name: ing, reason: match.reason });

      if (ALTERNATIVES[ing]) {
        alts.push({ from: ing, ...ALTERNATIVES[ing] });
      }
    } else {
      neutral.push({ name: ing, reason: 'No known concerns for most skin types' });
    }
  });

  renderResults(harsh, safe, conflicts, neutral, alts);
}

function renderResults(harsh, safe, conflicts, neutral, alts) {
  document.getElementById('resultsPlaceholder').style.display = 'none';
  document.getElementById('resultsContent').style.display = 'block';

  // Summary chips
  const summaryEl = document.getElementById('summaryChips');
  summaryEl.innerHTML = `
    <span class="tag tag-red">${harsh.length} Harsh</span>
    <span class="tag tag-green">${safe.length} Safe</span>
    <span class="tag tag-yellow">${conflicts.length} Conflicts</span>
    <span class="tag" style="background:var(--input-bg);color:var(--mid);">${neutral.length} Neutral</span>
  `;

  // Harsh
  const harshEl = document.getElementById('harshList');
  document.getElementById('harshSection').style.display = harsh.length ? 'block' : 'none';
  harshEl.innerHTML = harsh.map(i => `
    <div class="ingredient-item harsh">
      <div class="ingredient-item-inner">
        <div class="ing-name">${capitalise(i.name)}</div>
        <div class="ing-reason">${i.reason}</div>
      </div>
      <span class="tag tag-red">Harsh</span>
    </div>
  `).join('');

  // Conflicts
  const conflictEl = document.getElementById('conflictList');
  document.getElementById('conflictSection').style.display = conflicts.length ? 'block' : 'none';
  conflictEl.innerHTML = conflicts.map(i => `
    <div class="ingredient-item conflict">
      <div class="ingredient-item-inner">
        <div class="ing-name">${capitalise(i.name)}</div>
        <div class="ing-reason">${i.reason}</div>
      </div>
      <span class="tag tag-yellow">Conflict</span>
    </div>
  `).join('');

  // Safe
  const safeEl = document.getElementById('safeList');
  document.getElementById('safeSection').style.display = safe.length ? 'block' : 'none';
  safeEl.innerHTML = safe.map(i => `
    <div class="ingredient-item safe">
      <div class="ingredient-item-inner">
        <div class="ing-name">${capitalise(i.name)}</div>
        <div class="ing-reason">${i.reason}</div>
      </div>
      <span class="tag tag-green">Safe</span>
    </div>
  `).join('');

  // Alternatives
  const altEl = document.getElementById('altList');
  document.getElementById('altSection').style.display = alts.length ? 'block' : 'none';
  altEl.innerHTML = alts.map(a => `
    <div class="alt-item">
      <div>
        <div class="alt-from">${capitalise(a.from)}</div>
      </div>
      <div class="alt-arrow">→</div>
      <div>
        <div class="alt-to">${a.to}</div>
        <div class="alt-reason">${a.reason}</div>
      </div>
    </div>
  `).join('');

  notify('✅ Analysis complete!');
}

function capitalise(str) {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function notify(msg) {
  const n = document.getElementById('notif');
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 2800);
}