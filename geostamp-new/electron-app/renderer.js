const { ipcRenderer } = require('electron');
const ExifReader = require('exifreader');
const JSZip = require('jszip');

let selectedFiles = [];
let processedImages = [];
let currentNamingRule = 'date';
let currentCustomPrefix = '';
const MAX_FREE_IMAGES = 1;
let isSubscriber = false;

const geocodeCache = new Map();
const geocodeQueue = [];
let isProcessingQueue = false;
const RATE_LIMIT_MS = 1100;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('file-input').addEventListener('change', handleFileSelect);
  document.getElementById('upload-area').addEventListener('click', () => {
    document.getElementById('file-input').click();
  });
  document.getElementById('upload-area').addEventListener('dragover', (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('active');
  });
  document.getElementById('upload-area').addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('active');
  });
  document.getElementById('upload-area').addEventListener('drop', handleDrop);
  document.getElementById('process-btn').addEventListener('click', processImages);
  document.getElementById('download-all-btn').addEventListener('click', downloadAllImages);

  document.querySelectorAll('input[name="naming-rule"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.naming-options label').forEach(opt => opt.classList.remove('selected'));
      e.target.closest('label').classList.add('selected');
      currentNamingRule = e.target.value;
      
      const customInput = document.getElementById('custom-prefix');
      if (e.target.value === 'custom') {
        customInput.classList.add('show');
        customInput.disabled = false;
      } else {
        customInput.classList.remove('show');
        customInput.disabled = true;
      }
    });
  });

  document.getElementById('custom-prefix').addEventListener('input', (e) => {
    currentCustomPrefix = e.target.value.trim();
  });

  ipcRenderer.on('files-selected', (event, paths) => {
    loadFilesFromPaths(paths);
  });
});

async function loadFilesFromPaths(paths) {
  const fs = require('fs').promises;
  const path = require('path');
  
  for (const filePath of paths) {
    try {
      const stats = await fs.stat(filePath);
      const buffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      
      const file = new File([buffer], fileName, { type: getMimeType(fileName) });
      selectedFiles.push(file);
    } catch (err) {
      console.error('Error loading file:', err);
    }
  }
  updatePreview();
}

function getMimeType(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'heic': 'image/heic'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
  
  if (!isSubscriber) {
    if (files.length > MAX_FREE_IMAGES) {
      showToast(`Free users can only process ${MAX_FREE_IMAGES} image at a time. Please upgrade to Pro for unlimited processing.`, true);
      return;
    }
    selectedFiles = files;
  } else {
    selectedFiles = [...selectedFiles, ...files];
  }
  
  updatePreview();
  e.target.value = '';
}

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('active');
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  
  if (files.length > 0) {
    if (!isSubscriber && files.length > MAX_FREE_IMAGES) {
      showToast(`Free users can only process ${MAX_FREE_IMAGES} image at a time. Please upgrade to Pro for unlimited processing.`, true);
      return;
    }
    
    if (!isSubscriber) {
      selectedFiles = files.slice(0, MAX_FREE_IMAGES);
    } else {
      selectedFiles = [...selectedFiles, ...files];
    }
    updatePreview();
  }
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  updatePreview();
}

function updatePreview() {
  const preview = document.getElementById('preview-container');
  const emptyPreview = document.getElementById('empty-preview');
  const processBtn = document.getElementById('process-btn');
  const downloadBtn = document.getElementById('download-all-btn');
  const fileCount = document.getElementById('file-count');

  if (selectedFiles.length > 0) {
    preview.style.display = 'grid';
    emptyPreview.style.display = 'none';
    processBtn.disabled = false;
    downloadBtn.disabled = processedImages.length === 0;
    
    fileCount.textContent = `${selectedFiles.length} image${selectedFiles.length !== 1 ? 's' : ''} selected`;

    preview.innerHTML = '';
    selectedFiles.slice(0, 8).forEach((file, i) => {
      const item = document.createElement('div');
      item.className = 'preview-item';
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      const removeBtn = document.createElement('div');
      removeBtn.className = 'remove';
      removeBtn.innerHTML = '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
      removeBtn.onclick = () => removeFile(i);
      item.appendChild(img);
      item.appendChild(removeBtn);
      preview.appendChild(item);
    });
    if (selectedFiles.length > 8) {
      const more = document.createElement('div');
      more.className = 'preview-item';
      more.style.display = 'flex';
      more.style.alignItems = 'center';
      more.style.justifyContent = 'center';
      more.style.color = '#71717a';
      more.textContent = `+${selectedFiles.length - 8}`;
      preview.appendChild(more);
    }
  } else {
    preview.style.display = 'none';
    emptyPreview.style.display = 'block';
    processBtn.disabled = true;
    downloadBtn.disabled = true;
    fileCount.textContent = '0 images selected';
  }
}

async function extractExif(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const tags = ExifReader.load(arrayBuffer);
    
    const result = {
      hasExif: false,
      gps: null,
      location: null,
      placeName: null,
      timestamp: null
    };

    if (tags.gps) {
      result.hasExif = true;
      if (tags.gps.Latitude && tags.gps.Longitude) {
        result.gps = {
          lat: tags.gps.Latitude,
          lng: tags.gps.Longitude
        };
        result.location = `${result.gps.lat.toFixed(6)}, ${result.gps.lng.toFixed(6)}`;
      }
    }

    if (tags.DateTimeOriginal) {
      result.hasExif = true;
      result.timestamp = tags.DateTimeOriginal.description;
    } else if (tags.DateTime) {
      result.hasExif = true;
      result.timestamp = tags.DateTime.description;
    }

    return result;
  } catch (error) {
    console.warn('EXIF extraction failed:', error);
    return { hasExif: false, gps: null, location: null, placeName: null, timestamp: null };
  }
}

function getCacheKey(lat, lng) {
  return `${lat.toFixed(5)}_${lng.toFixed(5)}`;
}

function getCachedResult(lat, lng) {
  const key = getCacheKey(lat, lng);
  const cached = localStorage.getItem(`geocode_cache_${key}`);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.expires > Date.now()) return parsed.address;
    } catch {}
  }
  return null;
}

function setCachedResult(lat, lng, address) {
  const key = getCacheKey(lat, lng);
  const cacheEntry = { address, expires: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  localStorage.setItem(`geocode_cache_${key}`, JSON.stringify(cacheEntry));
  geocodeCache.set(key, address);
}

async function processQueue() {
  if (isProcessingQueue || geocodeQueue.length === 0) return;
  isProcessingQueue = true;

  while (geocodeQueue.length > 0) {
    const { lat, lng, resolve } = geocodeQueue.shift();
    const cached = getCachedResult(lat, lng);
    if (cached) {
      resolve(cached);
      await sleep(RATE_LIMIT_MS / 3);
      continue;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'GeoStamp/1.0 (contact@geostamp.app)' } }
      );

      if (res.ok) {
        const data = await res.json();
        const address = data.display_name
          ? (data.display_name.split(', ').length >= 3
              ? data.display_name.split(', ').slice(0, 3).join(', ')
              : data.display_name)
          : null;
        if (address) {
          setCachedResult(lat, lng, address);
        }
        resolve(address);
      } else {
        resolve(null);
      }
    } catch (e) {
      console.error('Geocoding error:', e);
      resolve(null);
    }

    await sleep(RATE_LIMIT_MS);
  }
  isProcessingQueue = false;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function reverseGeocode(lat, lng) {
  const cached = getCachedResult(lat, lng);
  if (cached) return cached;

  return new Promise(resolve => {
    geocodeQueue.push({ lat, lng, resolve });
    processQueue();
  });
}

function getFileName(index, originalName, exif) {
  const serial = String(index + 1).padStart(3, '0');
  switch (currentNamingRule) {
    case 'date': return `${getTimestamp()}_${serial}.jpg`;
    case 'original': return originalName;
    case 'gps':
      if (exif && exif.gps) {
        const lat = exif.gps.lat.toFixed(2).replace('.', '_');
        const lng = exif.gps.lng.toFixed(2).replace('.', '_');
        return `${lat}_${lng}_${serial}.jpg`;
      }
      return `${getTimestamp()}_${serial}.jpg`;
    case 'custom':
      const prefix = currentCustomPrefix || 'custom';
      return `${prefix}_${serial}.jpg`;
    default: return `${getTimestamp()}_${serial}.jpg`;
  }
}

function getTimestamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

async function processImage(file, exif, serial) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const barHeight = Math.max(35, Math.floor(img.height * 0.045));
      const padding = Math.max(10, Math.floor(img.width * 0.01));
      const fontSize = Math.max(11, Math.floor(barHeight * 0.4));

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      ctx.roundRect(0, img.height - barHeight, img.width, barHeight, [10, 0, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textBaseline = 'middle';

      const parts = [];
      if (exif.placeName && exif.placeName.trim()) parts.push(exif.placeName.trim());
      else if (exif.location && exif.location.trim()) parts.push(exif.location.trim());
      else parts.push('No GPS data');

      if (exif.timestamp && exif.timestamp.trim()) parts.push(exif.timestamp.trim());
      else parts.push(new Date().toISOString().replace('T', ' ').substring(0, 19));

      let serialText = `#${serial}`;
      if (currentNamingRule === 'custom' && currentCustomPrefix) {
        serialText = `${currentCustomPrefix}_${serial}`;
      } else if (currentNamingRule === 'original') {
        serialText = '';
      }
      if (serialText) parts.push(serialText);

      const text = parts.join(' | ');
      const textWidth = ctx.measureText(text).width;
      if (textWidth > img.width - padding * 2) {
        const scaled = Math.max(9, fontSize * (img.width - padding * 2) / textWidth);
        ctx.font = `${scaled}px -apple-system, BlinkMacSystemFont, sans-serif`;
      }
      ctx.fillText(text, padding, img.height - barHeight / 2);

      canvas.toBlob(blob => {
        URL.revokeObjectURL(img.src);
        resolve({ blob, url: URL.createObjectURL(blob) });
      }, 'image/jpeg', 0.95);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(null);
    };
    img.src = URL.createObjectURL(file);
  });
}

async function processImages() {
  if (selectedFiles.length === 0) return;

  const loadingOverlay = document.getElementById('loading-overlay');
  const progressFill = document.getElementById('progress-fill');
  const loadingText = document.querySelector('.loading-text');
  const downloadBtn = document.getElementById('download-all-btn');
  const resultsGrid = document.getElementById('results-grid');
  const emptyResults = document.getElementById('empty-results');

  loadingOverlay.classList.add('show');
  progressFill.style.width = '0%';
  processedImages = [];

  for (let i = 0; i < selectedFiles.length; i++) {
    loadingText.textContent = `Processing ${i + 1}/${selectedFiles.length}`;

    const exif = await extractExif(selectedFiles[i]);
    if (exif.gps) {
      try {
        const placeName = await reverseGeocode(exif.gps.lat, exif.gps.lng);
        exif.placeName = placeName || exif.location || `${exif.gps.lat.toFixed(4)}, ${exif.gps.lng.toFixed(4)}`;
      } catch (e) {
        exif.placeName = exif.location || `${exif.gps.lat.toFixed(4)}, ${exif.gps.lng.toFixed(4)}`;
      }
    }

    const processed = await processImage(selectedFiles[i], exif, i + 1);
    if (processed) {
      const fileName = getFileName(i, selectedFiles[i].name, exif);
      processedImages.push({ ...processed, originalName: selectedFiles[i].name, fileName });
    }

    progressFill.style.width = `${((i + 1) / selectedFiles.length) * 100}%`;
  }

  loadingOverlay.classList.remove('show');
  resultsGrid.innerHTML = '';
  emptyResults.style.display = 'none';

  processedImages.forEach((img, i) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    const imageEl = document.createElement('img');
    imageEl.src = img.url;
    const info = document.createElement('div');
    info.className = 'info';
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = img.fileName;
    const btn = document.createElement('button');
    btn.className = 'download-btn';
    btn.innerHTML = '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>';
    btn.onclick = () => downloadSingle(img.blob, img.fileName);

    info.appendChild(name);
    info.appendChild(btn);
    card.appendChild(imageEl);
    card.appendChild(info);
    resultsGrid.appendChild(card);
  });

  downloadBtn.disabled = false;
  showToast(`Successfully processed ${processedImages.length} images!`);
}

function downloadSingle(blob, filename) {
  ipcRenderer.send('save-file', { blob: Array.from(new Uint8Array(blob)), filename });
  
  ipcRenderer.once('save-file-result', (event, result) => {
    if (result.success) {
      showToast('File saved successfully!');
    } else {
      showToast(`Error: ${result.error}`, true);
    }
  });
}

async function downloadAllImages() {
  if (processedImages.length === 0) return;

  if (processedImages.length === 1) {
    downloadSingle(processedImages[0].blob, processedImages[0].fileName);
    return;
  }

  const filesToSave = processedImages.map(img => ({
    blob: Array.from(new Uint8Array(img.blob)),
    filename: img.fileName
  }));

  ipcRenderer.send('save-folder', { files: filesToSave });

  ipcRenderer.once('save-folder-result', (event, result) => {
    if (result.success) {
      showToast(`Saved ${result.savedCount} images successfully!${result.errorCount > 0 ? ` ${result.errorCount} failed.` : ''}`);
    } else {
      showToast(`Error: ${result.error}`, true);
    }
  });
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');
  toastText.textContent = message;
  
  if (isError) {
    toast.classList.add('error');
  } else {
    toast.classList.remove('error');
  }
  
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}