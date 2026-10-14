/**
 * Preview & Export Controller for Tab Recorder HD
 */

document.addEventListener('DOMContentLoaded', async () => {
  const videoPlayer = document.getElementById('videoPlayer');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingStatusText = document.getElementById('loadingStatusText');
  const btnDownload = document.getElementById('btnDownload');
  const btnDeleteCurrent = document.getElementById('btnDeleteCurrent');
  const recordingTitle = document.getElementById('recordingTitle');
  const tagResolution = document.getElementById('tagResolution');
  const tagDuration = document.getElementById('tagDuration');
  const tagSize = document.getElementById('tagSize');
  const tagDate = document.getElementById('tagDate');

  const btnOpenLibrary = document.getElementById('btnOpenLibrary');
  const btnCloseLibrary = document.getElementById('btnCloseLibrary');
  const libraryDrawer = document.getElementById('libraryDrawer');
  const libraryList = document.getElementById('libraryList');

  let currentRecording = null;
  let currentObjectUrl = null;

  // Format Helpers
  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatDuration(ms) {
    if (!ms) return '00:00';
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

  // Load Recording by ID
  async function loadRecording(id) {
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.opacity = '1';
    loadingStatusText.textContent = 'Loading video stream...';

    try {
      let record = null;
      if (id) {
        record = await window.RecorderDB.getRecording(id);
      }

      // Fallback to most recent recording if id not given or not found
      if (!record) {
        const all = await window.RecorderDB.getAllRecordings();
        if (all && all.length > 0) {
          all.sort((a, b) => b.timestamp - a.timestamp);
          record = all[0];
        }
      }

      if (!record || !record.blob) {
        loadingStatusText.textContent = 'No recording found. Record a tab first!';
        return;
      }

      currentRecording = record;

      // Revoke previous URL to prevent memory leaks
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }

      currentObjectUrl = URL.createObjectURL(record.blob);
      videoPlayer.src = currentObjectUrl;

      // Update metadata displays
      recordingTitle.textContent = `Tab Recording - ${formatDate(record.timestamp)}`;
      tagResolution.textContent = record.resolution === '720p' ? '720p HD' : '1080p Full HD';
      tagDuration.textContent = formatDuration(record.duration);
      tagSize.textContent = formatBytes(record.size);
      tagDate.textContent = formatDate(record.timestamp);

      videoPlayer.onloadedmetadata = () => {
        // Fade out loading
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 300);
      };

      // Refresh sidebar list
      await renderLibraryList();
    } catch (err) {
      console.error('Error loading recording:', err);
      loadingStatusText.textContent = 'Failed to load video: ' + err.message;
    }
  }

  // Download Action
  btnDownload.addEventListener('click', () => {
    if (!currentRecording || !currentObjectUrl) return;

    const timestampStr = new Date(currentRecording.timestamp || Date.now())
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);

    const a = document.createElement('a');
    a.href = currentObjectUrl;
    a.download = `tab-recording-${timestampStr}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  // Delete Current Recording Action
  btnDeleteCurrent.addEventListener('click', async () => {
    if (!currentRecording) return;

    const confirmed = confirm('Are you sure you want to delete this recording?');
    if (!confirmed) return;

    await window.RecorderDB.deleteRecording(currentRecording.id);
    // Load next or show empty
    loadRecording(null);
  });

  // Sidebar Controls
  btnOpenLibrary.addEventListener('click', () => {
    libraryDrawer.classList.add('open');
  });

  btnCloseLibrary.addEventListener('click', () => {
    libraryDrawer.classList.remove('open');
  });

  async function renderLibraryList() {
    const list = await window.RecorderDB.getAllRecordings();
    libraryList.innerHTML = '';

    if (!list || list.length === 0) {
      libraryList.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">No saved recordings yet.</p>';
      return;
    }

    list.sort((a, b) => b.timestamp - a.timestamp);

    list.forEach((item) => {
      const el = document.createElement('div');
      el.className = `library-item ${currentRecording && currentRecording.id === item.id ? 'active' : ''}`;
      el.innerHTML = `
        <span class="library-item-title">${formatDate(item.timestamp)}</span>
        <span class="library-item-meta">${item.resolution || '1080p'} • ${formatDuration(item.duration)} • ${formatBytes(item.size)}</span>
      `;

      el.addEventListener('click', () => {
        loadRecording(item.id);
        libraryDrawer.classList.remove('open');
      });

      libraryList.appendChild(el);
    });
  }

  // Init from URL Query Params
  const urlParams = new URLSearchParams(window.location.search);
  const requestedId = urlParams.get('id');
  loadRecording(requestedId);
});
