// Switch between pages
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  window.scrollTo(0, 0);
  updateNav(name);
}

// Highlight active nav button
function updateNav(name) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const map = { login: 0, profile: 1, dashboard: 2 };
  document.querySelectorAll('.nav-btn')[map[name]]?.classList.add('active');
}

// Login button handler
function handleLogin() {
  const email = document.getElementById('login-email').value;
  const pass  = document.getElementById('login-pass').value;

  if (!email || !pass) {
    notify('Please fill in all fields');
    return;
  }

  notify('Logging in…');
  setTimeout(() => showPage('profile'), 900);
}

// Select a skin type card (only one at a time)
function selectType(el) {
  document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

// Toggle a skin concern chip (multiple allowed)
function toggleConcern(el) {
  el.classList.toggle('selected');
}

// Save profile and go to dashboard
function saveProfile() {
  const selectedType = document.querySelector('.type-card.selected');

  if (!selectedType) {
    notify('Please select your skin type');
    return;
  }

  notify('Profile saved! Redirecting…');
  setTimeout(() => showPage('dashboard'), 900);
}

// Show a toast notification
function notify(msg) {
  const n = document.getElementById('notif');
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 2800);
}