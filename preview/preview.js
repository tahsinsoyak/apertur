/**
 * Preview Cinema Player & Studio Video Gallery Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const playerView = document.getElementById('playerView');
  const galleryView = document.getElementById('galleryView');
  const navTabPlayer = document.getElementById('navTabPlayer');
  const navTabGallery = document.getElementById('navTabGallery');
  const galleryCountBadge = document.getElementById('galleryCountBadge');

  const videoPlayer = document.getElementById('videoPlayer');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingStatusText = document.getElementById('loadingStatusText');
  const btnDownload = document.getElementById('btnDownload');
  const btnDeleteCurrent = document.getElementById('btnDeleteCurrent');
  const btnSwitchToGallery = document.getElementById('btnSwitchToGallery');
  const btnNewRecording = document.getElementById('btnNewRecording');

  const recordingTitle = document.getElementById('recordingTitle');
  const tagResolution = document.getElementById('tagResolution');
  const tagFps = document.getElementById('tagFps');
  const tagDuration = document.getElementById('tagDuration');
  const tagSize = document.getElementById('tagSize');
  const tagDate = document.getElementById('tagDate');

  const galleryGrid = document.getElementById('galleryGrid');
  const galleryEmptyState = document.getElementById('galleryEmptyState');
  const gallerySummaryText = document.getElementById('gallerySummaryText');
  const btnClearAll = document.getElementById('btnClearAll');
  const btnEmptyStart = document.getElementById('btnEmptyStart');

  let currentRecording = null;
  let currentObjectUrl = null;
  let allRecordingsCache = [];

  // --------------------------------------------------------------------------
  // Formatting Utilities
  // --------------------------------------------------------------------------
  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatDuration(ms) {
    if (!ms || ms === 0) return '00:00';
    const totalSec = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function formatDate(timestamp) {
    if (!timestamp) return 'Recent';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // --------------------------------------------------------------------------
  // Tab Switching
  // --------------------------------------------------------------------------
  function showPlayerView() {
    playerView.classList.remove('hidden');
    galleryView.classList.add('hidden');
    navTabPlayer.classList.add('active');
    navTabGallery.classList.remove('active');
  }

  function showGalleryView() {
    playerView.classList.add('hidden');
    galleryView.classList.remove('hidden');
    navTabPlayer.classList.remove('active');
    navTabGallery.classList.add('active');
    if (videoPlayer) videoPlayer.pause();
    renderGallery();
  }

  navTabPlayer.addEventListener('click', showPlayerView);
  navTabGallery.addEventListener('click', showGalleryView);
  if (btnSwitchToGallery) btnSwitchToGallery.addEventListener('click', showGalleryView);

  if (btnNewRecording) {
    btnNewRecording.addEventListener('click', () => window.close());
  }
  if (btnEmptyStart) {
    btnEmptyStart.addEventListener('click', () => window.close());
  }

  // --------------------------------------------------------------------------
  // Player Loading
  // --------------------------------------------------------------------------
  async function loadRecording(id) {
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.opacity = '1';
    loadingStatusText.textContent = 'Loading video stream...';

    try {
      let record = null;
      if (id) {
        record = await window.RecorderDB.getRecording(id);
      }

      // Fallback to most recent recording
      if (!record) {
        const all = await window.RecorderDB.getAllRecordings();
        if (all && all.length > 0) {
          all.sort((a, b) => b.timestamp - a.timestamp);
          record = all[0];
        }
      }

      if (!record || !record.blob) {
        loadingStatusText.textContent = 'No recording found. Record a tab first!';
        showGalleryView();
        return;
      }

      currentRecording = record;

      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }

      currentObjectUrl = URL.createObjectURL(record.blob);
      videoPlayer.src = currentObjectUrl;

      recordingTitle.textContent = `Tab Recording — ${formatDate(record.timestamp)}`;
      tagResolution.textContent = record.resolution === '720p' ? '720p HD' : '1080p Full HD';
      if (tagFps) tagFps.textContent = `${record.fps || 60} FPS`;
      tagDuration.textContent = formatDuration(record.duration);
      tagSize.textContent = formatBytes(record.size);
      tagDate.textContent = formatDate(record.timestamp);

      videoPlayer.onloadedmetadata = () => {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 300);
      };

      showPlayerView();
      await updateGalleryBadge();
    } catch (err) {
      console.error('Error loading recording:', err);
      loadingStatusText.textContent = 'Failed to load video: ' + err.message;
    }
  }

  // Download Action
  btnDownload.addEventListener('click', () => {
    if (!currentRecording || !currentObjectUrl) return;
    downloadBlob(currentRecording.blob, currentRecording.timestamp);
  });

  function downloadBlob(blob, timestamp) {
    const timestampStr = new Date(timestamp || Date.now())
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tab-recording-${timestampStr}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Delete Action
  btnDeleteCurrent.addEventListener('click', async () => {
    if (!currentRecording) return;
    const confirmed = confirm('Are you sure you want to delete this recording?');
    if (!confirmed) return;

    await window.RecorderDB.deleteRecording(currentRecording.id);
    await loadRecording(null);
  });

  // --------------------------------------------------------------------------
  // Full Video Gallery Renderer
  // --------------------------------------------------------------------------
  async function updateGalleryBadge() {
    const list = await window.RecorderDB.getAllRecordings();
    allRecordingsCache = list || [];
    galleryCountBadge.textContent = allRecordingsCache.length;
  }

  async function renderGallery() {
    const list = await window.RecorderDB.getAllRecordings();
    allRecordingsCache = list || [];
    galleryCountBadge.textContent = allRecordingsCache.length;

    galleryGrid.innerHTML = '';

    if (!allRecordingsCache || allRecordingsCache.length === 0) {
      galleryEmptyState.classList.remove('hidden');
      galleryGrid.classList.add('hidden');
      gallerySummaryText.textContent = '0 recordings saved';
      return;
    }

    galleryEmptyState.classList.add('hidden');
    galleryGrid.classList.remove('hidden');

    // Sort by latest first
    allRecordingsCache.sort((a, b) => b.timestamp - a.timestamp);

    // Calculate total size
    const totalBytes = allRecordingsCache.reduce((acc, cur) => acc + (cur.size || 0), 0);
    gallerySummaryText.textContent = `${allRecordingsCache.length} recording${allRecordingsCache.length > 1 ? 's' : ''} • ${formatBytes(totalBytes)} stored locally`;

    allRecordingsCache.forEach((rec) => {
      const card = document.createElement('div');
      card.className = `gallery-card ${currentRecording && currentRecording.id === rec.id ? 'active-playing' : ''}`;

      const blobUrl = URL.createObjectURL(rec.blob);

      card.innerHTML = `
        <div class="gallery-thumbnail-box" title="Click to watch in Cinema Player">
          <video class="gallery-thumbnail-video" src="${blobUrl}#t=0.5" preload="metadata"></video>
          <div class="gallery-play-overlay">
            <div class="play-circle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
          </div>
          <div class="thumbnail-badges">
            <span class="thumb-badge res">${rec.resolution === '720p' ? '720p' : '1080p'}</span>
            <span class="thumb-badge">${formatDuration(rec.duration)}</span>
          </div>
        </div>

        <div class="gallery-card-body">
          <div class="card-title-row">
            <span class="card-title" title="${formatDate(rec.timestamp)}">Recording — ${formatDate(rec.timestamp)}</span>
            <span class="card-subtitle">${rec.fps || 60} FPS • VP9 High Bitrate</span>
          </div>

          <div class="card-actions-row">
            <span class="card-size-label">${formatBytes(rec.size)}</span>
            <div class="card-btn-group">
              <button class="card-mini-btn download" title="Download video (.webm)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                <span>Save</span>
              </button>

              <button class="card-mini-btn delete" title="Delete recording">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;

      // Click card thumbnail to watch in player
      card.querySelector('.gallery-thumbnail-box').addEventListener('click', () => {
        loadRecording(rec.id);
      });

      // Download
      card.querySelector('.card-mini-btn.download').addEventListener('click', (e) => {
        e.stopPropagation();
        downloadBlob(rec.blob, rec.timestamp);
      });

      // Delete
      card.querySelector('.card-mini-btn.delete').addEventListener('click', async (e) => {
        e.stopPropagation();
        const conf = confirm('Delete this recording from library?');
        if (!conf) return;

        await window.RecorderDB.deleteRecording(rec.id);
        if (currentRecording && currentRecording.id === rec.id) {
          currentRecording = null;
        }
        await renderGallery();
      });

      galleryGrid.appendChild(card);
    });
  }

  // Clear All
  btnClearAll.addEventListener('click', async () => {
    if (!allRecordingsCache || allRecordingsCache.length === 0) return;
    const conf = confirm(`Are you sure you want to delete ALL ${allRecordingsCache.length} recordings from your library? This cannot be undone.`);
    if (!conf) return;

    for (const rec of allRecordingsCache) {
      await window.RecorderDB.deleteRecording(rec.id);
    }
    currentRecording = null;
    await renderGallery();
  });

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------
  const urlParams = new URLSearchParams(window.location.search);
  const requestedId = urlParams.get('id');
  const requestedView = urlParams.get('view');

  if (requestedView === 'gallery') {
    showGalleryView();
  } else {
    loadRecording(requestedId);
  }
});
