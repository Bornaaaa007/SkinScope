// ─────────────────────────────────────────
//   SKINSCOPE — products.js
// ─────────────────────────────────────────

// Track added products
const addedProducts = new Set();

// Filter products by category
function filterProducts(category, chipEl) {
  // Update active chip
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chipEl.classList.add('active');

  // Show/hide category sections
  document.querySelectorAll('.category-section').forEach(section => {
    if (category === 'all') {
      section.style.display = 'block';
    } else {
      section.style.display = section.dataset.category === category ? 'block' : 'none';
    }
  });
}

// Add product to routine
function addToRoutine(btn, productName) {
  if (addedProducts.has(productName)) {
    notify(`${productName} is already in your routine`);
    return;
  }

  addedProducts.add(productName);
  btn.textContent = '✓ Added';
  btn.classList.add('added');
  btn.disabled = true;

  // Save to localStorage
  const saved = JSON.parse(localStorage.getItem('addedProducts') || '[]');
  saved.push(productName);
  localStorage.setItem('addedProducts', JSON.stringify(saved));

  notify(`✅ ${productName} added to your routine`);
}

// View product details
function viewDetails(productName) {
  notify(`📋 Details for ${productName} — full page coming soon`);
}

// On load — restore any previously added products
document.addEventListener('DOMContentLoaded', () => {
  const saved = JSON.parse(localStorage.getItem('addedProducts') || '[]');
  saved.forEach(name => addedProducts.add(name));

  document.querySelectorAll('.add-btn').forEach(btn => {
    const productName = btn.closest('.product-body').querySelector('.product-name').textContent;
    if (addedProducts.has(productName)) {
      btn.textContent = '✓ Added';
      btn.classList.add('added');
      btn.disabled = true;
    }
  });
});

function notify(msg) {
  const n = document.getElementById('notif');
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 2800);
}