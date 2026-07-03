// ─────────────────────────────────────────
//   SKINSCOPE — feedback.js
// ─────────────────────────────────────────

let overallRating = 0;
const featureRatings = {};
const selectedConflicts = new Set();

const RATING_LABELS = {
  1: 'Poor — not helpful at all',
  2: 'Fair — needs improvement',
  3: 'Good — somewhat helpful',
  4: 'Very Good — mostly helpful',
  5: 'Excellent — very helpful!'
};

// ─── Overall star rating ───
function setRating(value) {
  overallRating = value;
  updateStars(document.querySelectorAll('#starRow .star'), value);
  document.getElementById('ratingLabel').textContent = RATING_LABELS[value];
}

function hoverRating(value) {
  updateStars(document.querySelectorAll('#starRow .star'), value);
}

function resetHover() {
  updateStars(document.querySelectorAll('#starRow .star'), overallRating);
}

function updateStars(stars, value) {
  stars.forEach((star, i) => {
    star.classList.toggle('active', i < value);
  });
}

// ─── Feature mini-star ratings ───
function setFeatureRating(feature, value) {
  featureRatings[feature] = value;
  const stars = document.querySelectorAll(`[data-feature="${feature}"] .mini-star`);
  stars.forEach((star, i) => {
    star.classList.toggle('active', i < value);
  });
}

// ─── Conflict tags ───
function toggleConflict(el) {
  const label = el.textContent.trim();
  if (selectedConflicts.has(label)) {
    selectedConflicts.delete(label);
    el.style.opacity = '0.5';
    el.style.textDecoration = 'line-through';
  } else {
    selectedConflicts.add(label);
    el.style.opacity = '1';
    el.style.textDecoration = 'none';
    el.style.fontWeight = '600';
  }
}

// ─── Submit feedback ───
function submitFeedback() {
  if (overallRating === 0) {
    notify('Please select an overall rating before submitting');
    return;
  }

  const liked   = document.getElementById('likedComment').value.trim();
  const improve = document.getElementById('improveComment').value.trim();

  // Build feedback object — send this to backend later
  const feedbackData = {
    overallRating,
    featureRatings,
    conflicts: [...selectedConflicts],
    liked,
    improve,
    submittedAt: new Date().toISOString()
  };

  // Save locally for now
  localStorage.setItem('lastFeedback', JSON.stringify(feedbackData));

  console.log('Feedback submitted:', feedbackData);

  // Show success state
  document.getElementById('feedbackForm').style.display = 'none';
  document.getElementById('successState').classList.add('show');
}

function notify(msg) {
  const n = document.getElementById('notif');
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 2800);
}