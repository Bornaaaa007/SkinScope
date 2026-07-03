// ─────────────────────────────────────────
//   SKINSCOPE — diagnose.js
// ─────────────────────────────────────────

// Handle file select via browse button
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) loadImagePreview(file);
}

// Drag over — highlight drop area
function handleDragOver(event) {
  event.preventDefault();
  document.getElementById('uploadArea').classList.add('drag-over');
}

// Drag leave — remove highlight
function handleDragLeave(event) {
  document.getElementById('uploadArea').classList.remove('drag-over');
}

// Drop file onto area
function handleDrop(event) {
  event.preventDefault();
  document.getElementById('uploadArea').classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    loadImagePreview(file);
  } else {
    notify('Please drop a valid image file (JPG, PNG, WEBP)');
  }
}

// Keep the actual File object around so we can send it to the backend later
let selectedFile = null;

// Load selected image into preview area
function loadImagePreview(file) {
  if (file.size > 10 * 1024 * 1024) {
    notify('File too large. Maximum size is 10MB.');
    return;
  }

  selectedFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('previewImg').src = e.target.result;
    document.getElementById('previewArea').classList.add('show');
    document.getElementById('uploadArea').style.display = 'none';
    document.getElementById('analyzeRow').style.display = 'flex';
  };
  reader.readAsDataURL(file);
}

// Remove image and reset UI
function removeImage() {
  document.getElementById('previewImg').src = '';
  document.getElementById('previewArea').classList.remove('show');
  document.getElementById('uploadArea').style.display = 'block';
  document.getElementById('analyzeRow').style.display = 'none';
  document.getElementById('fileInput').value = '';
}

// Real camera capture using getUserMedia
let cameraStream = null;

function startCamera() {
  const modal = document.getElementById('cameraModal');
  const video = document.getElementById('cameraVideo');
  const errEl = document.getElementById('cameraError');
  errEl.style.display = 'none';
  modal.style.display = 'flex';

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    .then(stream => {
      cameraStream = stream;
      video.srcObject = stream;
    })
    .catch(err => {
      errEl.textContent = 'Could not access camera: ' + err.message +
        ' — check your browser gave this page camera permission, and that you\'re on http://localhost (not file://).';
      errEl.style.display = 'block';
    });
}

function closeCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  document.getElementById('cameraModal').style.display = 'none';
}

function capturePhoto() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');
  if (!video.videoWidth) return; // camera not ready yet

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  // mirror horizontally so the saved photo matches what's visually on screen
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(blob => {
    const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
    loadImagePreview(file);
    closeCamera();
  }, 'image/jpeg', 0.92);
}

// The Flask ML backend from the ml/ folder. Change this if you deploy elsewhere.
const API_URL = 'http://localhost:5000/api/analyze';

// Real AI skin analysis — sends the photo to the Flask/ML backend
function analyzeSkin() {
  if (!selectedFile) {
    notify('Please select a photo first.');
    return;
  }

  document.getElementById('analyzeRow').style.display = 'none';
  document.getElementById('analyzeLoading').classList.add('show');

  const formData = new FormData();
  formData.append('photo', selectedFile);

  fetch(API_URL, { method: 'POST', body: formData })
    .then(res => {
      if (!res.ok) return res.json().then(err => { throw new Error(err.error || 'Analysis failed'); });
      return res.json();
    })
    .then(result => {
      // Hand the result off to result.html via sessionStorage
      sessionStorage.setItem('skinAnalysisResult', JSON.stringify(result));
      window.location.href = 'result.html';
    })
    .catch(err => {
      document.getElementById('analyzeLoading').classList.remove('show');
      document.getElementById('analyzeRow').style.display = 'flex';
      notify('⚠️ ' + err.message + ' — is the ML backend running? (python app.py)');
    });
}

function notify(msg) {
  const n = document.getElementById('notif');
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 2800);
}