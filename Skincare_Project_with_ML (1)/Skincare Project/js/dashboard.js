// ─────────────────────────────────────────
//   SKINSCOPE — dashboard.js
// ─────────────────────────────────────────

// Load saved profile data from localStorage and update UI
document.addEventListener('DOMContentLoaded', () => {
  const skinType = localStorage.getItem('skinType');
  const concerns = JSON.parse(localStorage.getItem('concerns') || '[]');

  // Update badge if skin type is saved
  if (skinType) {
    const badge = document.querySelector('.dash-badge');
    if (badge) badge.innerHTML = `<span class="dot"></span> Profile Active &middot; ${skinType} Skin`;
  }

  // Update skin tags in the summary banner
  if (concerns.length > 0) {
    const tagsEl = document.querySelector('.skin-tags');
    if (tagsEl) {
      tagsEl.innerHTML = '';
      if (skinType) {
        tagsEl.innerHTML += `<span class="skin-tag">${skinType}</span>`;
      }
      concerns.slice(0, 3).forEach(c => {
        tagsEl.innerHTML += `<span class="skin-tag">${c}</span>`;
      });
    }
  }

  // Set greeting based on time of day
  const hour = new Date().getHours();
  const greetingEl = document.querySelector('.dash-greeting .hey');
  if (greetingEl) {
    if (hour < 12)      greetingEl.textContent = 'Good morning,';
    else if (hour < 17) greetingEl.textContent = 'Good afternoon,';
    else                greetingEl.textContent = 'Good evening,';
  }
});

function notify(msg) {
  const n = document.getElementById('notif');
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 2800);
}