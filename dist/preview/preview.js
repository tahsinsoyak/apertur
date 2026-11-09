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
  const btnRenameTitle = document.getElementById('btnRenameTitle');
  const btnPlaybackSpeed = document.getElementById('btnPlaybackSpeed');
  const btnSnapshot = document.getElementById('btnSnapshot');

  const trimStartRange = document.getElementById('trimStartRange');
  const trimEndRange = document.getElementById('trimEndRange');
  const trimStartVal = document.getElementById('trimStartVal');
  const trimEndVal = document.getElementById('trimEndVal');
  const btnPreviewTrim = document.getElementById('btnPreviewTrim');
  const btnResetTrim = document.getElementById('btnResetTrim');
  const btnApplyTrim = document.getElementById('btnApplyTrim');

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
  const playbackSpeeds = [1, 1.25, 1.5, 2];
  let currentSpeedIndex = 0;
  let totalDurationSec = 0;
  let trimStartSec = 0;
  let trimEndSec = 0;
  let isApplyingTrim = false;
  let currentMediaFilter = 'all';
  let modalCurrentItem = null;
  let isModalZoomed = false;

  // Media Library Elements & Modal
  const filterButtons = document.querySelectorAll('.media-filter-pill');
  const imageViewerModal = document.getElementById('imageViewerModal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const modalImageTitle = document.getElementById('modalImageTitle');
  const modalImageMeta = document.getElementById('modalImageMeta');
  const modalFullImage = document.getElementById('modalFullImage');
  const modalBody = document.querySelector('.image-modal-body');
  const btnModalZoom = document.getElementById('btnModalZoom');
  const modalZoomLabel = document.getElementById('modalZoomLabel');
  const btnModalCopy = document.getElementById('btnModalCopy');
  const btnModalDownload = document.getElementById('btnModalDownload');
  const btnModalDelete = document.getElementById('btnModalDelete');
  const modalCopyLabel = document.getElementById('modalCopyLabel');

  // Export Presets Elements
  const btnExportMenu = document.getElementById('btnExportMenu');
  const exportPresetsDropdown = document.getElementById('exportPresetsDropdown');
  const exportPresetItems = document.querySelectorAll('.export-preset-item');
  const downloadBtnText = document.getElementById('downloadBtnText');

  // Annotation Studio Elements
  const btnModalAnnotate = document.getElementById('btnModalAnnotate');
  const modalAnnotateLabel = document.getElementById('modalAnnotateLabel');
  const annotationToolbar = document.getElementById('annotationToolbar');
  const annotCanvas = document.getElementById('annotCanvas');
  const annotToolButtons = document.querySelectorAll('.annot-tool-btn');
  const annotColorButtons = document.querySelectorAll('.annot-color-btn');
  const annotStrokeButtons = document.querySelectorAll('.annot-stroke-btn');
  const btnAnnotUndo = document.getElementById('btnAnnotUndo');
  const btnAnnotClear = document.getElementById('btnAnnotClear');
  const btnAnnotSave = document.getElementById('btnAnnotSave');

  let isAnnotateMode = false;
  let currentAnnotTool = 'pen';
  let currentAnnotColor = '#f59e0b';
  let currentAnnotSize = 5;
  let annotUndoStack = [];
  let isDrawingAnnot = false;
  let annotStartX = 0;
  let annotStartY = 0;
  let annotSnapshot = null;
  let annotBaseImage = null;

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentMediaFilter = btn.dataset.filter || 'all';
      renderGallery();
    });
  });

  function setModalZoom(zoomed) {
    isModalZoomed = zoomed;
    if (modalBody) {
      modalBody.classList.toggle('zoom-full', isModalZoomed);
    }
    if (modalZoomLabel) {
      modalZoomLabel.textContent = isModalZoomed ? 'Fit Screen' : '100% Size';
    }
    if (modalFullImage) {
      modalFullImage.title = isModalZoomed ? 'Click to fit image to window' : 'Click to view at 100% full size';
    }
  }

  function openImageModal(item) {
    modalCurrentItem = item;
    if (modalImageTitle) modalImageTitle.textContent = item.title || 'Screenshot';
    if (modalImageMeta) {
      modalImageMeta.textContent = item.dimensions ? `${item.dimensions.width} × ${item.dimensions.height}` : 'PNG';
    }
    const src = item.dataUrl || (item.blob ? URL.createObjectURL(item.blob) : '');
    if (modalFullImage) modalFullImage.src = src;

    // Automatically enable full scroll mode if it's a long full-page screenshot
    const isVeryTall = Boolean(item.dimensions && item.dimensions.height / (item.dimensions.width || 1) > 1.8);
    setModalZoom(isVeryTall);

    if (imageViewerModal) imageViewerModal.classList.remove('hidden');
  }

  function exitAnnotateMode() {
    isAnnotateMode = false;
    if (modalAnnotateLabel) modalAnnotateLabel.textContent = 'Annotate';
    if (btnModalAnnotate) btnModalAnnotate.classList.remove('primary');
    if (annotationToolbar) annotationToolbar.classList.add('hidden');
    if (annotCanvas) annotCanvas.classList.add('hidden');
    if (modalFullImage) modalFullImage.classList.remove('hidden');
  }

  function closeImageModal() {
    exitAnnotateMode();
    if (imageViewerModal) imageViewerModal.classList.add('hidden');
    modalCurrentItem = null;
    setModalZoom(false);
  }

  // --------------------------------------------------------------------------
  // Annotation Studio Engine
  // --------------------------------------------------------------------------
  function getCanvasCoords(e) {
    if (!annotCanvas) return { x: 0, y: 0 };
    const rect = annotCanvas.getBoundingClientRect();
    const scaleX = annotCanvas.width / (rect.width || 1);
    const scaleY = annotCanvas.height / (rect.height || 1);
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function drawArrow(ctx, fromX, fromY, toX, toY, color, width) {
    const headlen = Math.max(14, width * 3.4);
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  async function toggleAnnotateMode() {
    if (!modalCurrentItem) return;
    isAnnotateMode = !isAnnotateMode;

    if (isAnnotateMode) {
      if (modalAnnotateLabel) modalAnnotateLabel.textContent = 'Done Editing';
      if (btnModalAnnotate) btnModalAnnotate.classList.add('primary');
      if (annotationToolbar) annotationToolbar.classList.remove('hidden');
      if (modalFullImage) modalFullImage.classList.add('hidden');
      if (annotCanvas) annotCanvas.classList.remove('hidden');

      const src = modalCurrentItem.dataUrl || modalFullImage.src;
      annotBaseImage = new Image();
      annotBaseImage.crossOrigin = 'anonymous';
      await new Promise((resolve) => {
        annotBaseImage.onload = resolve;
        annotBaseImage.src = src;
      });

      annotCanvas.width = annotBaseImage.naturalWidth || annotBaseImage.width;
      annotCanvas.height = annotBaseImage.naturalHeight || annotBaseImage.height;
      const ctx = annotCanvas.getContext('2d');
      ctx.drawImage(annotBaseImage, 0, 0);

      annotUndoStack = [ctx.getImageData(0, 0, annotCanvas.width, annotCanvas.height)];
    } else {
      exitAnnotateMode();
    }
  }

  if (btnModalAnnotate) {
    btnModalAnnotate.addEventListener('click', toggleAnnotateMode);
  }

  annotToolButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      annotToolButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentAnnotTool = btn.dataset.tool || 'pen';
    });
  });

  annotColorButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      annotColorButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentAnnotColor = btn.dataset.color || '#f59e0b';
    });
  });

  annotStrokeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      annotStrokeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentAnnotSize = Number(btn.dataset.size) || 5;
    });
  });

  if (annotCanvas) {
    annotCanvas.addEventListener('pointerdown', (e) => {
      if (!isAnnotateMode) return;
      const ctx = annotCanvas.getContext('2d');
      const { x, y } = getCanvasCoords(e);
      annotStartX = x;
      annotStartY = y;
      isDrawingAnnot = true;
      annotSnapshot = ctx.getImageData(0, 0, annotCanvas.width, annotCanvas.height);

      if (currentAnnotTool === 'pen') {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = currentAnnotColor;
        ctx.lineWidth = currentAnnotSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else if (currentAnnotTool === 'highlight') {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = currentAnnotColor;
        ctx.lineWidth = Math.max(18, currentAnnotSize * 3.5);
        ctx.lineCap = 'square';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.38;
      } else if (currentAnnotTool === 'text') {
        isDrawingAnnot = false;
        const text = prompt('Enter text callout:');
        if (text && text.trim()) {
          const fontSize = Math.max(16, currentAnnotSize * 4.2);
          ctx.save();
          ctx.font = `bold ${fontSize}px Inter, -apple-system, sans-serif`;
          const metrics = ctx.measureText(text);
          const pad = 8;
          const boxW = metrics.width + pad * 2;
          const boxH = fontSize + pad * 2;

          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x - pad, y - fontSize, boxW, boxH, 6);
          } else {
            ctx.rect(x - pad, y - fontSize, boxW, boxH);
          }
          ctx.fill();

          ctx.fillStyle = currentAnnotColor;
          ctx.fillText(text, x, y + 2);
          ctx.restore();

          annotUndoStack.push(ctx.getImageData(0, 0, annotCanvas.width, annotCanvas.height));
          if (annotUndoStack.length > 25) annotUndoStack.shift();
        }
      }
    });

    annotCanvas.addEventListener('pointermove', (e) => {
      if (!isAnnotateMode || !isDrawingAnnot) return;
      const ctx = annotCanvas.getContext('2d');
      const { x, y } = getCanvasCoords(e);

      if (currentAnnotTool === 'pen') {
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (currentAnnotTool === 'highlight') {
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (currentAnnotTool === 'arrow') {
        ctx.putImageData(annotSnapshot, 0, 0);
        drawArrow(ctx, annotStartX, annotStartY, x, y, currentAnnotColor, currentAnnotSize);
      } else if (currentAnnotTool === 'rect') {
        ctx.putImageData(annotSnapshot, 0, 0);
        const rx = Math.min(annotStartX, x);
        const ry = Math.min(annotStartY, y);
        const rw = Math.abs(x - annotStartX);
        const rh = Math.abs(y - annotStartY);

        ctx.save();
        ctx.strokeStyle = currentAnnotColor;
        ctx.lineWidth = currentAnnotSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(rx, ry, rw, rh, 6);
        } else {
          ctx.rect(rx, ry, rw, rh);
        }
        ctx.stroke();
        ctx.restore();
      }
    });

    function finishDrawing() {
      if (!isAnnotateMode || !isDrawingAnnot) return;
      isDrawingAnnot = false;
      const ctx = annotCanvas.getContext('2d');
      ctx.globalAlpha = 1.0;
      annotUndoStack.push(ctx.getImageData(0, 0, annotCanvas.width, annotCanvas.height));
      if (annotUndoStack.length > 25) annotUndoStack.shift();
    }

    annotCanvas.addEventListener('pointerup', finishDrawing);
    annotCanvas.addEventListener('pointerleave', finishDrawing);
  }

  if (btnAnnotUndo) {
    btnAnnotUndo.addEventListener('click', () => {
      if (annotUndoStack.length > 1) {
        annotUndoStack.pop();
        const prev = annotUndoStack[annotUndoStack.length - 1];
        const ctx = annotCanvas.getContext('2d');
        ctx.putImageData(prev, 0, 0);
      }
    });
  }

  if (btnAnnotClear) {
    btnAnnotClear.addEventListener('click', () => {
      if (!annotBaseImage || !annotCanvas) return;
      const ctx = annotCanvas.getContext('2d');
      ctx.drawImage(annotBaseImage, 0, 0);
      annotUndoStack = [ctx.getImageData(0, 0, annotCanvas.width, annotCanvas.height)];
    });
  }

  if (btnAnnotSave) {
    btnAnnotSave.addEventListener('click', async () => {
      if (!modalCurrentItem || !annotCanvas) return;
      const btnSpan = btnAnnotSave.querySelector('span');
      if (btnSpan) btnSpan.textContent = 'Saving...';

      try {
        const dataUrl = annotCanvas.toDataURL('image/png');
        modalCurrentItem.dataUrl = dataUrl;
        if (modalFullImage) modalFullImage.src = dataUrl;

        await window.RecorderDB.saveScreenshot(modalCurrentItem);
        await renderGallery();

        if (btnSpan) {
          btnSpan.textContent = '✓ Saved to Library!';
          setTimeout(() => { btnSpan.textContent = 'Save to Library'; }, 1600);
        }
      } catch (err) {
        if (btnSpan) {
          btnSpan.textContent = 'Save Failed';
          setTimeout(() => { btnSpan.textContent = 'Save to Library'; }, 1600);
        }
      }
    });
  }

  if (btnModalZoom) {
    btnModalZoom.addEventListener('click', () => {
      setModalZoom(!isModalZoomed);
    });
  }

  if (modalFullImage) {
    modalFullImage.addEventListener('click', () => {
      setModalZoom(!isModalZoomed);
    });
  }

  if (btnModalDelete) {
    btnModalDelete.addEventListener('click', async () => {
      if (!modalCurrentItem) return;
      const conf = confirm(`Delete "${modalCurrentItem.title || 'this screenshot'}" from your library?`);
      if (!conf) return;

      await window.RecorderDB.deleteRecording(modalCurrentItem.id);
      closeImageModal();
      await renderGallery();
    });
  }

  if (btnCloseModal) btnCloseModal.addEventListener('click', closeImageModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeImageModal);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && imageViewerModal && !imageViewerModal.classList.contains('hidden')) {
      closeImageModal();
    }
  });

  if (btnModalCopy) {
    btnModalCopy.addEventListener('click', async () => {
      if (!modalCurrentItem) return;
      try {
        let blob = null;
        if (isAnnotateMode && annotCanvas) {
          blob = await new Promise(r => annotCanvas.toBlob(r, 'image/png'));
        } else {
          const src = modalCurrentItem.dataUrl || modalFullImage.src;
          const res = await fetch(src);
          blob = await res.blob();
        }
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        if (modalCopyLabel) modalCopyLabel.textContent = 'Copied!';
        setTimeout(() => { if (modalCopyLabel) modalCopyLabel.textContent = 'Copy Image'; }, 1500);
      } catch (err) {
        if (modalCopyLabel) modalCopyLabel.textContent = 'Copy Failed';
        setTimeout(() => { if (modalCopyLabel) modalCopyLabel.textContent = 'Copy Image'; }, 1500);
      }
    });
  }

  if (btnModalDownload) {
    btnModalDownload.addEventListener('click', () => {
      if (!modalCurrentItem) return;
      const src = (isAnnotateMode && annotCanvas) ? annotCanvas.toDataURL('image/png') : (modalCurrentItem.dataUrl || modalFullImage.src);
      const a = document.createElement('a');
      a.href = src;
      const stamp = new Date(modalCurrentItem.timestamp || Date.now()).toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = `apertur-screenshot-${stamp}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

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

  function formatTrimSeconds(sec) {
    const safe = Math.max(0, Number(sec) || 0);
    const mins = Math.floor(safe / 60).toString().padStart(2, '0');
    const rem = (safe % 60).toFixed(1).padStart(4, '0');
    return `${mins}:${rem}`;
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

  function getRecordingDisplayTitle(rec) {
    if (rec && rec.customTitle && rec.customTitle.trim()) {
      return rec.customTitle.trim();
    }
    return `Apertur Capture (${formatDate(rec?.timestamp)})`;
  }

  function initTrimControls(durationMs) {
    totalDurationSec = Math.max(0.5, Number(((durationMs || 1000) / 1000).toFixed(1)));
    trimStartSec = 0;
    trimEndSec = totalDurationSec;

    if (trimStartRange && trimEndRange) {
      trimStartRange.min = '0';
      trimStartRange.max = String(totalDurationSec);
      trimStartRange.step = '0.1';
      trimStartRange.value = '0';

      trimEndRange.min = '0';
      trimEndRange.max = String(totalDurationSec);
      trimEndRange.step = '0.1';
      trimEndRange.value = String(totalDurationSec);
    }
    if (trimStartVal) trimStartVal.textContent = formatTrimSeconds(0);
    if (trimEndVal) trimEndVal.textContent = formatTrimSeconds(totalDurationSec);
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

      // Fallback to most recent video recording
      if (!record) {
        const all = await window.RecorderDB.getAllRecordings();
        if (all && all.length > 0) {
          const videos = all.filter((item) => item.type !== 'screenshot' && item.blob);
          if (videos.length > 0) {
            videos.sort((a, b) => b.timestamp - a.timestamp);
            record = videos[0];
          }
        }
      }

      if (!record || !record.blob) {
        showGalleryView();
        return;
      }

      currentRecording = record;

      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }

      currentObjectUrl = URL.createObjectURL(record.blob);
      videoPlayer.src = currentObjectUrl;
      videoPlayer.playbackRate = playbackSpeeds[currentSpeedIndex] || 1;

      recordingTitle.textContent = getRecordingDisplayTitle(record);
      tagResolution.textContent = record.resolution === '720p' ? '720p HD' : '1080p Full HD';
      if (tagFps) tagFps.textContent = `${record.fps || 60} FPS`;
      tagDuration.textContent = formatDuration(record.duration);
      tagSize.textContent = formatBytes(record.size);
      tagDate.textContent = formatDate(record.timestamp);

      initTrimControls(record.duration);

      videoPlayer.onloadedmetadata = () => {
        if (Number.isFinite(videoPlayer.duration) && videoPlayer.duration > 0) {
          initTrimControls(videoPlayer.duration * 1000);
        }
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

  // --------------------------------------------------------------------------
  // Trim Start / End Logic
  // --------------------------------------------------------------------------
  if (trimStartRange) {
    trimStartRange.addEventListener('input', () => {
      let nextStart = parseFloat(trimStartRange.value) || 0;
      if (nextStart >= trimEndSec - 0.2) {
        nextStart = Math.max(0, Number((trimEndSec - 0.2).toFixed(1)));
        trimStartRange.value = String(nextStart);
      }
      trimStartSec = nextStart;
      if (trimStartVal) trimStartVal.textContent = formatTrimSeconds(trimStartSec);
      if (videoPlayer) {
        try { videoPlayer.currentTime = trimStartSec; } catch (_) {}
      }
    });
  }

  if (trimEndRange) {
    trimEndRange.addEventListener('input', () => {
      let nextEnd = parseFloat(trimEndRange.value) || totalDurationSec;
      if (nextEnd <= trimStartSec + 0.2) {
        nextEnd = Math.min(totalDurationSec, Number((trimStartSec + 0.2).toFixed(1)));
        trimEndRange.value = String(nextEnd);
      }
      trimEndSec = nextEnd;
      if (trimEndVal) trimEndVal.textContent = formatTrimSeconds(trimEndSec);
      if (videoPlayer) {
        try { videoPlayer.currentTime = trimEndSec; } catch (_) {}
      }
    });
  }

  if (videoPlayer) {
    videoPlayer.addEventListener('timeupdate', () => {
      if (!isApplyingTrim && trimEndSec > 0 && videoPlayer.currentTime >= trimEndSec) {
        videoPlayer.pause();
        try { videoPlayer.currentTime = trimStartSec; } catch (_) {}
      }
    });
  }

  if (btnPreviewTrim) {
    btnPreviewTrim.addEventListener('click', () => {
      if (!videoPlayer) return;
      try {
        videoPlayer.currentTime = trimStartSec;
        videoPlayer.play().catch(() => {});
      } catch (_) {}
    });
  }

  if (btnResetTrim) {
    btnResetTrim.addEventListener('click', () => {
      initTrimControls(currentRecording?.duration || (totalDurationSec * 1000));
      if (videoPlayer) {
        try { videoPlayer.currentTime = 0; } catch (_) {}
      }
    });
  }

  if (btnApplyTrim) {
    btnApplyTrim.addEventListener('click', async () => {
      if (!currentRecording || !videoPlayer || isApplyingTrim) return;
      const isUnchanged = trimStartSec <= 0.05 && Math.abs(trimEndSec - totalDurationSec) <= 0.1;
      if (isUnchanged) {
        btnApplyTrim.textContent = 'Move Sliders First';
        setTimeout(() => { btnApplyTrim.textContent = 'Save Trimmed Video'; }, 1400);
        return;
      }

      isApplyingTrim = true;
      btnApplyTrim.disabled = true;
      btnApplyTrim.textContent = 'Trimming Video...';

      try {
        videoPlayer.pause();
        const prevMuted = videoPlayer.muted;
        const prevRate = videoPlayer.playbackRate;
        videoPlayer.playbackRate = 1;
        videoPlayer.currentTime = trimStartSec;

        await new Promise((resolve) => {
          const onSeeked = () => {
            videoPlayer.removeEventListener('seeked', onSeeked);
            resolve();
          };
          videoPlayer.addEventListener('seeked', onSeeked);
          setTimeout(resolve, 250);
        });

        const stream = videoPlayer.captureStream ? videoPlayer.captureStream() : videoPlayer.mozCaptureStream();
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm';
        const chunks = [];
        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 10000000
        });

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        const trimmedBlob = await new Promise((resolve, reject) => {
          recorder.onstop = () => {
            resolve(new Blob(chunks, { type: mimeType }));
          };
          recorder.onerror = (err) => reject(err);

          recorder.start(100);
          videoPlayer.play().catch(reject);

          const checkStop = setInterval(() => {
            if (videoPlayer.currentTime >= trimEndSec || videoPlayer.ended) {
              clearInterval(checkStop);
              videoPlayer.pause();
              if (recorder.state !== 'inactive') {
                recorder.stop();
              }
            }
          }, 50);
        });

        videoPlayer.muted = prevMuted;
        videoPlayer.playbackRate = prevRate;

        if (trimmedBlob && trimmedBlob.size > 0) {
          const newDurationMs = Math.max(200, Math.round((trimEndSec - trimStartSec) * 1000));
          currentRecording.blob = trimmedBlob;
          currentRecording.size = trimmedBlob.size;
          currentRecording.duration = newDurationMs;

          await window.RecorderDB.saveRecording(currentRecording);
          await loadRecording(currentRecording.id);

          btnApplyTrim.textContent = 'Trim Saved!';
          setTimeout(() => { btnApplyTrim.textContent = 'Save Trimmed Video'; }, 1600);
        } else {
          btnApplyTrim.textContent = 'Save Trimmed Video';
        }
      } catch (err) {
        console.warn('Error applying trim:', err);
        btnApplyTrim.textContent = 'Save Trimmed Video';
      } finally {
        isApplyingTrim = false;
        btnApplyTrim.disabled = false;
      }
    });
  }

  // Inline Title Rename
  function startInlineTitleEdit() {
    if (!currentRecording || !recordingTitle) return;
    recordingTitle.contentEditable = 'true';
    recordingTitle.focus();
    const range = document.createRange();
    range.selectNodeContents(recordingTitle);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  async function commitInlineTitleEdit() {
    if (!currentRecording || !recordingTitle) return;
    recordingTitle.contentEditable = 'false';
    const nextTitle = (recordingTitle.textContent || '').trim();
    if (nextTitle) {
      currentRecording.customTitle = nextTitle;
      recordingTitle.textContent = nextTitle;
      try {
        await window.RecorderDB.saveRecording(currentRecording);
      } catch (e) {
        console.warn('Could not save custom title:', e);
      }
    } else {
      recordingTitle.textContent = getRecordingDisplayTitle(currentRecording);
    }
  }

  if (recordingTitle) {
    recordingTitle.addEventListener('click', startInlineTitleEdit);
    recordingTitle.addEventListener('blur', commitInlineTitleEdit);
    recordingTitle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        recordingTitle.blur();
      } else if (e.key === 'Escape') {
        recordingTitle.textContent = getRecordingDisplayTitle(currentRecording);
        recordingTitle.blur();
      }
    });
  }
  if (btnRenameTitle) {
    btnRenameTitle.addEventListener('click', startInlineTitleEdit);
  }

  // Playback Speed Switcher
  if (btnPlaybackSpeed) {
    btnPlaybackSpeed.addEventListener('click', () => {
      currentSpeedIndex = (currentSpeedIndex + 1) % playbackSpeeds.length;
      const rate = playbackSpeeds[currentSpeedIndex];
      if (videoPlayer) videoPlayer.playbackRate = rate;
      btnPlaybackSpeed.innerHTML = `<span>${rate}x Speed</span>`;
    });
  }

  // 1-Click Frame Screenshot (PNG)
  if (btnSnapshot) {
    btnSnapshot.addEventListener('click', () => {
      if (!videoPlayer || !videoPlayer.videoWidth) return;
      const canvas = document.createElement('canvas');
      canvas.width = videoPlayer.videoWidth;
      canvas.height = videoPlayer.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
      const snapLabelSpan = btnSnapshot.querySelector('span');

      canvas.toBlob(async (pngBlob) => {
        if (!pngBlob) return;
        const safeName = getSafeFilename(currentRecording);
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const dataUrl = canvas.toDataURL('image/png');

        // Save to IndexedDB so it appears in the Media Library
        try {
          await window.RecorderDB.saveScreenshot({
            id: `frame-${Date.now()}`,
            title: `${recordingTitle.textContent || 'Video'} (Frame)`,
            timestamp: Date.now(),
            dimensions: { width: canvas.width, height: canvas.height },
            size: pngBlob.size,
            dataUrl
          });
          await updateGalleryBadge();
        } catch (_) {}

        // Also copy to clipboard if supported
        let copied = false;
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
          copied = true;
        } catch (_) {}

        // Download PNG file
        const url = URL.createObjectURL(pngBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeName}-frame-${stamp}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        if (snapLabelSpan) {
          snapLabelSpan.textContent = copied ? 'Copied & Saved!' : 'Saved PNG!';
          setTimeout(() => { snapLabelSpan.textContent = 'Screenshot'; }, 1500);
        }
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, 'image/png');
    });
  }

  function getSafeFilename(rec) {
    if (rec && rec.customTitle && rec.customTitle.trim()) {
      const slug = rec.customTitle
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (slug) return slug;
    }
    const timestampStr = new Date(rec?.timestamp || Date.now())
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    return `apertur-${timestampStr}`;
  }

  // --------------------------------------------------------------------------
  // Export Presets & Video Encoding Engine
  // --------------------------------------------------------------------------
  if (btnExportMenu && exportPresetsDropdown) {
    btnExportMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      exportPresetsDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!exportPresetsDropdown.classList.contains('hidden') &&
          !e.target.closest('#exportPresetsDropdown') &&
          !e.target.closest('#btnExportMenu')) {
        exportPresetsDropdown.classList.add('hidden');
      }
    });

    exportPresetItems.forEach((btn) => {
      btn.addEventListener('click', async () => {
        exportPresetsDropdown.classList.add('hidden');
        exportPresetItems.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const preset = btn.dataset.preset;
        if (!currentRecording || !currentObjectUrl) return;

        if (preset === 'master') {
          downloadBlob(currentRecording.blob, currentRecording);
        } else if (preset === 'web720') {
          await exportWeb720Preset();
        } else if (preset === 'audio') {
          await exportAudioOnlyPreset();
        } else if (preset === 'loop') {
          await exportLoopPreset();
        }
      });
    });
  }

  async function exportWeb720Preset() {
    if (!videoPlayer || !currentRecording) return;
    const origText = downloadBtnText ? downloadBtnText.textContent : 'Download Video';
    if (downloadBtnText) downloadBtnText.textContent = 'Encoding 720p...';

    try {
      videoPlayer.pause();
      const prevTime = videoPlayer.currentTime;
      videoPlayer.currentTime = 0;
      await new Promise(r => {
        const onSeek = () => { videoPlayer.removeEventListener('seeked', onSeek); r(); };
        videoPlayer.addEventListener('seeked', onSeek);
        setTimeout(r, 200);
      });

      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream ? canvas.captureStream(30) : null;
      if (!stream) {
        throw new Error('Canvas capture stream not supported');
      }

      if (videoPlayer.captureStream) {
        const vStream = videoPlayer.captureStream();
        const aTracks = vStream.getAudioTracks();
        if (aTracks.length > 0) stream.addTrack(aTracks[0]);
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';
      const chunks = [];
      const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      let animId = null;
      function renderFrame() {
        ctx.drawImage(videoPlayer, 0, 0, 1280, 720);
        if (!videoPlayer.ended && !videoPlayer.paused) {
          animId = requestAnimationFrame(renderFrame);
        }
      }

      await new Promise((resolve, reject) => {
        rec.onstop = () => {
          if (animId) cancelAnimationFrame(animId);
          const outBlob = new Blob(chunks, { type: mimeType });
          const safeName = getSafeFilename(currentRecording);
          const url = URL.createObjectURL(outBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${safeName}-web-720p.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          resolve();
        };
        rec.onerror = reject;

        rec.start(100);
        videoPlayer.play().catch(reject);
        renderFrame();

        videoPlayer.onended = () => {
          if (rec.state !== 'inactive') rec.stop();
        };
      });

      videoPlayer.currentTime = prevTime;
      if (downloadBtnText) downloadBtnText.textContent = '✓ 720p Exported!';
      setTimeout(() => { if (downloadBtnText) downloadBtnText.textContent = origText; }, 1600);
    } catch (err) {
      console.warn('720p export fallback:', err);
      if (downloadBtnText) downloadBtnText.textContent = origText;
      downloadBlob(currentRecording.blob, currentRecording);
    }
  }

  async function exportAudioOnlyPreset() {
    if (!videoPlayer || !currentRecording) return;
    const origText = downloadBtnText ? downloadBtnText.textContent : 'Download Video';
    if (downloadBtnText) downloadBtnText.textContent = 'Extracting Audio...';

    try {
      videoPlayer.pause();
      const prevTime = videoPlayer.currentTime;
      videoPlayer.currentTime = 0;
      await new Promise(r => {
        const onSeek = () => { videoPlayer.removeEventListener('seeked', onSeek); r(); };
        videoPlayer.addEventListener('seeked', onSeek);
        setTimeout(r, 200);
      });

      const stream = videoPlayer.captureStream ? videoPlayer.captureStream() : videoPlayer.mozCaptureStream?.();
      const audioTracks = stream ? stream.getAudioTracks() : [];

      if (!stream || audioTracks.length === 0) {
        alert('This recording does not have an audio track to extract.');
        if (downloadBtnText) downloadBtnText.textContent = origText;
        return;
      }

      const audioOnlyStream = new MediaStream(audioTracks);
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const chunks = [];
      const rec = new MediaRecorder(audioOnlyStream, { mimeType });

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      await new Promise((resolve, reject) => {
        rec.onstop = () => {
          const outBlob = new Blob(chunks, { type: mimeType });
          const safeName = getSafeFilename(currentRecording);
          const url = URL.createObjectURL(outBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${safeName}-audio.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          resolve();
        };
        rec.onerror = reject;

        rec.start(100);
        videoPlayer.play().catch(reject);
        videoPlayer.onended = () => {
          if (rec.state !== 'inactive') rec.stop();
        };
      });

      videoPlayer.currentTime = prevTime;
      if (downloadBtnText) downloadBtnText.textContent = '✓ Audio Exported!';
      setTimeout(() => { if (downloadBtnText) downloadBtnText.textContent = origText; }, 1600);
    } catch (err) {
      console.warn('Audio export error:', err);
      if (downloadBtnText) downloadBtnText.textContent = origText;
    }
  }

  async function exportLoopPreset() {
    if (!videoPlayer || !currentRecording) return;
    const origText = downloadBtnText ? downloadBtnText.textContent : 'Download Video';
    if (downloadBtnText) downloadBtnText.textContent = 'Creating Loop...';

    try {
      videoPlayer.pause();
      const prevTime = videoPlayer.currentTime;
      videoPlayer.currentTime = 0;
      await new Promise(r => {
        const onSeek = () => { videoPlayer.removeEventListener('seeked', onSeek); r(); };
        videoPlayer.addEventListener('seeked', onSeek);
        setTimeout(r, 200);
      });

      const stream = videoPlayer.captureStream ? videoPlayer.captureStream() : videoPlayer.mozCaptureStream?.();
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';
      const chunks = [];
      const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6000000 });

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const loopLimit = Math.min(5, Number(videoPlayer.duration) || 5);

      await new Promise((resolve, reject) => {
        rec.onstop = () => {
          const outBlob = new Blob(chunks, { type: mimeType });
          const safeName = getSafeFilename(currentRecording);
          const url = URL.createObjectURL(outBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${safeName}-preview-loop.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          resolve();
        };
        rec.onerror = reject;

        rec.start(100);
        videoPlayer.play().catch(reject);

        const checkLoop = setInterval(() => {
          if (videoPlayer.currentTime >= loopLimit || videoPlayer.ended) {
            clearInterval(checkLoop);
            videoPlayer.pause();
            if (rec.state !== 'inactive') rec.stop();
          }
        }, 80);
      });

      videoPlayer.currentTime = prevTime;
      if (downloadBtnText) downloadBtnText.textContent = '✓ Loop Exported!';
      setTimeout(() => { if (downloadBtnText) downloadBtnText.textContent = origText; }, 1600);
    } catch (err) {
      console.warn('Loop export error:', err);
      if (downloadBtnText) downloadBtnText.textContent = origText;
    }
  }

  // Download Action
  btnDownload.addEventListener('click', () => {
    if (!currentRecording || !currentObjectUrl) return;
    downloadBlob(currentRecording.blob, currentRecording);
  });

  function downloadBlob(blob, recOrTimestamp) {
    const rec = typeof recOrTimestamp === 'object' ? recOrTimestamp : { timestamp: recOrTimestamp };
    const safeName = getSafeFilename(rec);

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}.webm`;
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
      gallerySummaryText.textContent = '0 items saved';
      return;
    }

    // Sort by latest first
    allRecordingsCache.sort((a, b) => b.timestamp - a.timestamp);

    // Filter items based on selected tab
    let itemsToRender = allRecordingsCache;
    if (currentMediaFilter === 'video') {
      itemsToRender = allRecordingsCache.filter((item) => item.type !== 'screenshot');
    } else if (currentMediaFilter === 'screenshot') {
      itemsToRender = allRecordingsCache.filter((item) => item.type === 'screenshot');
    }

    if (itemsToRender.length === 0) {
      galleryEmptyState.classList.remove('hidden');
      galleryGrid.classList.add('hidden');
      gallerySummaryText.textContent = `0 ${currentMediaFilter}s found`;
      return;
    }

    galleryEmptyState.classList.add('hidden');
    galleryGrid.classList.remove('hidden');

    const totalBytes = allRecordingsCache.reduce((acc, cur) => acc + (cur.size || 0), 0);
    const videoCount = allRecordingsCache.filter((i) => i.type !== 'screenshot').length;
    const snapCount = allRecordingsCache.filter((i) => i.type === 'screenshot').length;
    gallerySummaryText.textContent = `${videoCount} video${videoCount === 1 ? '' : 's'} • ${snapCount} screenshot${snapCount === 1 ? '' : 's'} • ${formatBytes(totalBytes)} stored locally`;

    itemsToRender.forEach((rec) => {
      const isScreenshot = (rec.type === 'screenshot');
      const card = document.createElement('div');
      card.className = `gallery-card ${isScreenshot ? 'screenshot-item' : ''} ${currentRecording && currentRecording.id === rec.id ? 'active-playing' : ''}`;

      const displayTitle = getRecordingDisplayTitle(rec);
      const mediaSrc = rec.dataUrl || (rec.blob ? URL.createObjectURL(rec.blob) : '');

      if (isScreenshot) {
        card.innerHTML = `
          <div class="gallery-thumbnail-box screenshot-thumb" title="Click to open full screenshot">
            <img class="gallery-thumbnail-img" src="${mediaSrc}" alt="${displayTitle}" loading="lazy" />
            <div class="gallery-play-overlay">
              <div class="play-circle" style="border-radius: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              </div>
            </div>
            <div class="thumbnail-badges">
              <span class="thumb-badge snap-badge">Screenshot</span>
              <span class="thumb-badge">${rec.dimensions ? `${rec.dimensions.width}×${rec.dimensions.height}` : 'PNG'}</span>
            </div>
          </div>

          <div class="gallery-card-body">
            <div class="card-title-row">
              <span class="card-title" title="${displayTitle}">${displayTitle}</span>
              <span class="card-subtitle">${formatDate(rec.timestamp)} • Lossless Image</span>
            </div>

            <div class="card-actions-row">
              <span class="card-size-label">${formatBytes(rec.size)}</span>
              <div class="card-btn-group">
                <button class="card-mini-btn copy-btn" title="Copy image to clipboard">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  <span>Copy</span>
                </button>

                <button class="card-mini-btn download" title="Download screenshot (.png)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  <span>Save</span>
                </button>

                <button class="card-mini-btn delete" title="Delete screenshot">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        `;

        card.querySelector('.gallery-thumbnail-box').addEventListener('click', () => {
          openImageModal(rec);
        });

        const copyBtn = card.querySelector('.card-mini-btn.copy-btn');
        if (copyBtn) {
          copyBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
              const res = await fetch(mediaSrc);
              const blob = await res.blob();
              await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
              const label = copyBtn.querySelector('span');
              if (label) label.textContent = 'Copied!';
              setTimeout(() => { if (label) label.textContent = 'Copy'; }, 1500);
            } catch (_) {}
          });
        }

        card.querySelector('.card-mini-btn.download').addEventListener('click', (e) => {
          e.stopPropagation();
          const a = document.createElement('a');
          a.href = mediaSrc;
          const stamp = new Date(rec.timestamp || Date.now()).toISOString().replace(/[:.]/g, '-').slice(0, 19);
          a.download = `apertur-screenshot-${stamp}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });

        card.querySelector('.card-mini-btn.delete').addEventListener('click', async (e) => {
          e.stopPropagation();
          const conf = confirm('Delete this screenshot from library?');
          if (!conf) return;
          await window.RecorderDB.deleteRecording(rec.id);
          await renderGallery();
        });

      } else {
        // Video card
        const blobUrl = mediaSrc;
        card.innerHTML = `
          <div class="gallery-thumbnail-box" title="Click to watch video">
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
              <span class="card-title" title="${displayTitle}">${displayTitle}</span>
              <span class="card-subtitle">${rec.fps || 60} FPS • Full HD WebM</span>
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

        const thumbBox = card.querySelector('.gallery-thumbnail-box');
        const thumbVideo = card.querySelector('.gallery-thumbnail-video');
        if (thumbVideo) {
          thumbVideo.muted = true;
          thumbBox.addEventListener('mouseenter', () => {
            thumbVideo.play().catch(() => {});
          });
          thumbBox.addEventListener('mouseleave', () => {
            thumbVideo.pause();
            try { thumbVideo.currentTime = 0.5; } catch (_) {}
          });
        }
        thumbBox.addEventListener('click', () => {
          loadRecording(rec.id);
        });

        card.querySelector('.card-mini-btn.download').addEventListener('click', (e) => {
          e.stopPropagation();
          downloadBlob(rec.blob, rec);
        });

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
      }

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
