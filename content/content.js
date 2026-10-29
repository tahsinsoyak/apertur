/**
 * Apertur: Content Script for Cursor FX & Floating HUD
 */

if (!window.__TAB_RECORDER_CONTENT_INITIALIZED__) {
  window.__TAB_RECORDER_CONTENT_INITIALIZED__ = true;

  let isEffectsActive = false;
  let haloEl = null;
  let dockEl = null;
  let dockTimerInterval = null;
  let recordingStartTime = null;
  let isPausedState = false;

  let currentOptions = {
    enableHalo: true,
    enableClickRipple: true,
    showFloatingDock: true,
    cursorTheme: 'yellow'
  };

  let mouseX = -200;
  let mouseY = -200;
  let hasMovedMouse = false;
  let rafId = null;

  const THEME_PALETTES = {
    yellow: {
      fill: 'rgba(245, 158, 11, 0.22)',
      fade: 'rgba(245, 158, 11, 0.06)',
      border: 'rgba(245, 158, 11, 0.65)',
      glow: 'rgba(245, 158, 11, 0.28)',
      ripple: 'rgba(245, 158, 11, 0.95)',
      rippleBg: 'rgba(245, 158, 11, 0.25)'
    },
    cyan: {
      fill: 'rgba(6, 182, 212, 0.22)',
      fade: 'rgba(6, 182, 212, 0.06)',
      border: 'rgba(6, 182, 212, 0.65)',
      glow: 'rgba(6, 182, 212, 0.28)',
      ripple: 'rgba(6, 182, 212, 0.95)',
      rippleBg: 'rgba(6, 182, 212, 0.25)'
    },
    violet: {
      fill: 'rgba(168, 85, 247, 0.22)',
      fade: 'rgba(168, 85, 247, 0.06)',
      border: 'rgba(168, 85, 247, 0.65)',
      glow: 'rgba(168, 85, 247, 0.28)',
      ripple: 'rgba(168, 85, 247, 0.95)',
      rippleBg: 'rgba(168, 85, 247, 0.25)'
    },
    red: {
      fill: 'rgba(244, 63, 94, 0.22)',
      fade: 'rgba(244, 63, 94, 0.06)',
      border: 'rgba(244, 63, 94, 0.65)',
      glow: 'rgba(244, 63, 94, 0.28)',
      ripple: 'rgba(244, 63, 94, 0.95)',
      rippleBg: 'rgba(244, 63, 94, 0.25)'
    },
    green: {
      fill: 'rgba(16, 185, 129, 0.22)',
      fade: 'rgba(16, 185, 129, 0.06)',
      border: 'rgba(16, 185, 129, 0.65)',
      glow: 'rgba(16, 185, 129, 0.28)',
      ripple: 'rgba(16, 185, 129, 0.95)',
      rippleBg: 'rgba(16, 185, 129, 0.25)'
    }
  };

  function getTheme() {
    return THEME_PALETTES[currentOptions.cursorTheme] || THEME_PALETTES.yellow;
  }

  function applyThemeVariables(el) {
    const t = getTheme();
    el.style.setProperty('--tr-halo-fill', t.fill);
    el.style.setProperty('--tr-halo-fade', t.fade);
    el.style.setProperty('--tr-halo-border', t.border);
    el.style.setProperty('--tr-halo-glow', t.glow);
    el.style.setProperty('--tr-ripple-color', t.ripple);
    el.style.setProperty('--tr-ripple-bg', t.rippleBg);
  }

  // --------------------------------------------------------------------------
  // Cursor Halo Management
  // --------------------------------------------------------------------------
  function createHalo() {
    if (haloEl) return;
    haloEl = document.createElement('div');
    haloEl.id = '__tab_recorder_cursor_halo__';
    haloEl.style.transform = 'translate3d(-200px, -200px, 0)';
    haloEl.style.opacity = '0';
    applyThemeVariables(haloEl);
    document.documentElement.appendChild(haloEl);
  }

  function removeHalo() {
    if (haloEl) {
      haloEl.remove();
      haloEl = null;
    }
  }

  function updateHaloLoop() {
    if (!isEffectsActive) return;
    if (haloEl && currentOptions.enableHalo && hasMovedMouse) {
      haloEl.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    }
    rafId = requestAnimationFrame(updateHaloLoop);
  }

  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    hasMovedMouse = true;
    if (haloEl && currentOptions.enableHalo) {
      haloEl.style.opacity = '1';
    }
  }

  function onMouseDown(e) {
    if (!isEffectsActive) return;
    if (dockEl && dockEl.contains(e.target)) return;

    if (haloEl && currentOptions.enableHalo) {
      haloEl.classList.add('tr-halo-pressing');
    }

    if (currentOptions.enableClickRipple) {
      spawnRipple(e.clientX, e.clientY);
    }
  }

  function onMouseUp() {
    if (haloEl) {
      haloEl.classList.remove('tr-halo-pressing');
    }
  }

  function spawnRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = '__tab_recorder_click_ripple__';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    applyThemeVariables(ripple);

    const core = document.createElement('div');
    core.className = '__tab_recorder_click_core__';
    core.style.left = `${x}px`;
    core.style.top = `${y}px`;
    applyThemeVariables(core);

    document.documentElement.appendChild(ripple);
    document.documentElement.appendChild(core);

    setTimeout(() => {
      ripple.remove();
      core.remove();
    }, 520);
  }

  // --------------------------------------------------------------------------
  // Floating Studio HUD
  // --------------------------------------------------------------------------
  function getPauseIconSvg(paused) {
    if (paused) {
      return `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    }
    return `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`;
  }

  function createFloatingDock() {
    if (dockEl || currentOptions.showFloatingDock === false) return;

    dockEl = document.createElement('div');
    dockEl.id = '__tab_recorder_floating_dock__';
    dockEl.innerHTML = `
      <div class="__tr_dock_grip__" title="Drag to reposition">
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
          <circle cx="2.5" cy="2.5" r="1.2"/>
          <circle cx="7.5" cy="2.5" r="1.2"/>
          <circle cx="2.5" cy="7" r="1.2"/>
          <circle cx="7.5" cy="7" r="1.2"/>
          <circle cx="2.5" cy="11.5" r="1.2"/>
          <circle cx="7.5" cy="11.5" r="1.2"/>
        </svg>
      </div>
      <div class="__tr_dock_status__">
        <span class="__tr_dock_dot__" id="__tr_dock_dot__"></span>
        <span class="__tr_dock_timer__" id="__tr_dock_timer__">00:00</span>
      </div>
      <div class="__tr_dock_divider__"></div>
      <button type="button" class="__tr_dock_btn__ snap-btn" id="__tr_btn_screenshot__" title="Save PNG screenshot of visible page">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span id="__tr_snap_label__">Snap</span>
      </button>
      <button type="button" class="__tr_dock_btn__ snap-btn" id="__tr_btn_dock_snip__" title="Crop a selected area (Snip)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="6" cy="6" r="3"/>
          <circle cx="6" cy="18" r="3"/>
          <line x1="20" y1="4" x2="8.12" y2="15.88"/>
          <line x1="14.47" y1="14.48" x2="20" y2="20"/>
          <line x1="8.12" y1="8.12" x2="12" y2="12"/>
        </svg>
        <span>Snip</span>
      </button>
      <button type="button" class="__tr_dock_btn__ pause-btn" id="__tr_btn_pause__" title="Pause or Resume">
        <span id="__tr_pause_icon__" style="display:inline-flex;">${getPauseIconSvg(false)}</span>
        <span id="__tr_pause_label__">Pause</span>
      </button>
      <button type="button" class="__tr_dock_btn__ stop-btn" id="__tr_btn_stop__" title="Finish and open video">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="3"/>
        </svg>
        <span id="__tr_stop_label__">Finish</span>
      </button>
      <button type="button" class="__tr_dock_btn__ hide-btn" id="__tr_btn_hide__" title="Hide HUD (recording continues)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    `;

    document.documentElement.appendChild(dockEl);

    // Drag repositioning
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    dockEl.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      isDragging = true;
      const rect = dockEl.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      dockEl.style.bottom = 'auto';
      dockEl.style.right = 'auto';
      dockEl.style.transform = 'none';
      dockEl.style.left = `${rect.left}px`;
      dockEl.style.top = `${rect.top}px`;
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging || !dockEl) return;
      const maxX = window.innerWidth - dockEl.offsetWidth - 8;
      const maxY = window.innerHeight - dockEl.offsetHeight - 8;
      const nextX = Math.max(8, Math.min(maxX, e.clientX - dragOffsetX));
      const nextY = Math.max(8, Math.min(maxY, e.clientY - dragOffsetY));
      dockEl.style.left = `${nextX}px`;
      dockEl.style.top = `${nextY}px`;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    window.addEventListener('resize', () => {
      if (!dockEl) return;
      const rect = dockEl.getBoundingClientRect();
      const maxX = window.innerWidth - dockEl.offsetWidth - 8;
      const maxY = window.innerHeight - dockEl.offsetHeight - 8;
      if (rect.left > maxX || rect.top > maxY) {
        dockEl.style.left = `${Math.max(8, Math.min(maxX, rect.left))}px`;
        dockEl.style.top = `${Math.max(8, Math.min(maxY, rect.top))}px`;
      }
    });

    // Controls
    const btnScreenshot = dockEl.querySelector('#__tr_btn_screenshot__');
    const btnDockSnip = dockEl.querySelector('#__tr_btn_dock_snip__');
    const btnPause = dockEl.querySelector('#__tr_btn_pause__');
    const btnStop = dockEl.querySelector('#__tr_btn_stop__');
    const btnHide = dockEl.querySelector('#__tr_btn_hide__');

    if (btnScreenshot) {
      btnScreenshot.addEventListener('click', (e) => {
        e.stopPropagation();
        captureVisibleScreenshot({ copyToClipboard: false, download: true, saveToLibrary: true });
      });
    }

    if (btnDockSnip) {
      btnDockSnip.addEventListener('click', (e) => {
        e.stopPropagation();
        startAreaSnipping();
      });
    }

    btnPause.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isPausedState) {
        chrome.runtime.sendMessage({ action: 'RESUME_RECORDING_REQUEST' }, () => {
          setDockPaused(false);
        });
      } else {
        chrome.runtime.sendMessage({ action: 'PAUSE_RECORDING_REQUEST' }, () => {
          setDockPaused(true);
        });
      }
    });

    btnStop.addEventListener('click', (e) => {
      e.stopPropagation();
      const stopLabel = dockEl ? dockEl.querySelector('#__tr_stop_label__') : null;
      if (stopLabel) stopLabel.textContent = 'Saving...';
      btnStop.style.opacity = '0.75';
      btnStop.style.pointerEvents = 'none';

      chrome.runtime.sendMessage({ action: 'STOP_RECORDING_REQUEST' }, () => {
        deactivateEffects();
      });
    });

    btnHide.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFloatingDock();
    });

    startDockTimer();
  }

  function setDockPaused(paused) {
    isPausedState = paused;
    if (!dockEl) return;
    const dot = dockEl.querySelector('#__tr_dock_dot__');
    const label = dockEl.querySelector('#__tr_pause_label__');
    const icon = dockEl.querySelector('#__tr_pause_icon__');
    if (paused) {
      dot.classList.add('paused');
      label.textContent = 'Resume';
      if (icon) icon.innerHTML = getPauseIconSvg(true);
    } else {
      dot.classList.remove('paused');
      label.textContent = 'Pause';
      if (icon) icon.innerHTML = getPauseIconSvg(false);
    }
  }

  function startDockTimer() {
    if (dockTimerInterval) clearInterval(dockTimerInterval);
    if (!recordingStartTime) recordingStartTime = Date.now();

    function tick() {
      if (!dockEl) return;
      const timerNode = dockEl.querySelector('#__tr_dock_timer__');
      if (!timerNode) return;
      const elapsed = Math.max(0, Date.now() - recordingStartTime);
      const totalSec = Math.floor(elapsed / 1000);
      const mins = Math.floor(totalSec / 60).toString().padStart(2, '0');
      const secs = (totalSec % 60).toString().padStart(2, '0');
      timerNode.textContent = `${mins}:${secs}`;
    }

    tick();
    dockTimerInterval = setInterval(tick, 1000);
  }

  function removeFloatingDock() {
    if (dockTimerInterval) {
      clearInterval(dockTimerInterval);
      dockTimerInterval = null;
    }
    if (dockEl) {
      dockEl.remove();
      dockEl = null;
    }
  }

  // --------------------------------------------------------------------------
  // Activation / Deactivation
  // --------------------------------------------------------------------------
  function activateEffects(options = {}, startTime = null, isPaused = false) {
    const normalizedTheme = options.cursorTheme || options.theme || currentOptions.cursorTheme || 'yellow';
    currentOptions = {
      ...currentOptions,
      ...options,
      cursorTheme: normalizedTheme
    };
    recordingStartTime = startTime || options.startTime || recordingStartTime || Date.now();
    isPausedState = Boolean(isPaused || options.isPaused);

    if (isEffectsActive) {
      if (currentOptions.enableHalo) {
        createHalo();
        applyThemeVariables(haloEl);
      } else {
        removeHalo();
      }
      if (currentOptions.showFloatingDock !== false) {
        createFloatingDock();
        setDockPaused(isPausedState);
      } else {
        removeFloatingDock();
      }
      return;
    }

    isEffectsActive = true;

    if (currentOptions.enableHalo) {
      createHalo();
    }
    if (currentOptions.showFloatingDock !== false) {
      createFloatingDock();
      setDockPaused(isPausedState);
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true, capture: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true, capture: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true, capture: true });

    rafId = requestAnimationFrame(updateHaloLoop);
  }

  function deactivateEffects() {
    isEffectsActive = false;
    hasMovedMouse = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    window.removeEventListener('mousemove', onMouseMove, { capture: true });
    window.removeEventListener('mousedown', onMouseDown, { capture: true });
    window.removeEventListener('mouseup', onMouseUp, { capture: true });
    removeHalo();
    removeFloatingDock();
  }

  function showCountdownOverlay(seconds = 3) {
    const existing = document.getElementById('__tab_recorder_countdown_overlay__');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = '__tab_recorder_countdown_overlay__';
    overlay.innerHTML = `
      <div class="__tr_countdown_card__">
        <span class="__tr_countdown_number__" id="__tr_countdown_num__">${seconds}</span>
        <span class="__tr_countdown_label__">Get Ready...</span>
      </div>
    `;
    document.documentElement.appendChild(overlay);

    const numEl = overlay.querySelector('#__tr_countdown_num__');
    let remaining = seconds;

    const timer = setInterval(() => {
      remaining -= 1;
      if (remaining >= 1) {
        if (numEl) numEl.textContent = String(remaining);
      } else {
        clearInterval(timer);
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 140);
      }
    }, 950);
  }

  // --------------------------------------------------------------------------
  // Screenshot & Snipping Suite
  // --------------------------------------------------------------------------
  let isSnipActive = false;
  let activeSnipOverlay = null;

  function showAperturToast(message, type = 'success', duration = 3000) {
    const existing = document.querySelector('.__apertur_toast__');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `__apertur_toast__ ${type}`;
    const iconSvg = type === 'success'
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    document.documentElement.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      setTimeout(() => toast.remove(), 220);
    }, duration);
  }

  function getTimestampString() {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }

  function downloadBlobFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function loadImageAsync(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load captured image slice'));
      img.src = src;
    });
  }

  async function copyBlobToClipboard(blob) {
    try {
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        return true;
      }
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
    return false;
  }

  async function captureVisibleScreenshot(options = {}) {
    if (dockEl) dockEl.style.opacity = '0';
    if (haloEl) haloEl.style.opacity = '0';
    await new Promise((r) => setTimeout(r, 70));

    chrome.runtime.sendMessage({ action: 'CAPTURE_TAB_SCREENSHOT_REQUEST' }, async (res) => {
      const _ = chrome.runtime.lastError;
      if (dockEl) dockEl.style.opacity = '1';
      if (haloEl && currentOptions.enableHalo && hasMovedMouse) haloEl.style.opacity = '1';

      if (!res || !res.success || !res.dataUrl) {
        showAperturToast(res?.error || 'Could not capture tab screenshot', 'info');
        return;
      }

      try {
        const img = await loadImageAsync(res.dataUrl);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(async (blob) => {
          const stamp = getTimestampString();
          const pageTitle = (document.title || 'Tab Screenshot').replace(/[/\\?%*:|"<>]/g, '-').slice(0, 40);

          // Save to library
          chrome.runtime.sendMessage({
            action: 'SAVE_SCREENSHOT_TO_LIBRARY_REQUEST',
            screenshot: {
              id: 'snap-' + Date.now(),
              title: `${pageTitle} (Visible)`,
              timestamp: Date.now(),
              dimensions: { width: canvas.width, height: canvas.height },
              size: blob.size,
              type: 'screenshot',
              dataUrl: res.dataUrl
            }
          });

          let copied = false;
          if (options.copyToClipboard !== false) {
            copied = await copyBlobToClipboard(blob);
          }
          if (options.download !== false) {
            downloadBlobFile(blob, `apertur-${pageTitle}-${stamp}.png`);
          }

          if (copied) {
            showAperturToast('✓ Screenshot copied to clipboard & saved!', 'success');
          } else {
            showAperturToast('✓ Screenshot saved to Downloads & Library!', 'success');
          }
        }, 'image/png');
      } catch (err) {
        showAperturToast('Screenshot error: ' + err.message, 'info');
      }
    });
  }

  function startAreaSnipping(options = {}) {
    if (isSnipActive) return;
    isSnipActive = true;

    const overlay = document.createElement('div');
    overlay.id = '__apertur_snip_overlay__';
    overlay.style.cssText = 'position:fixed !important;inset:0 !important;width:100vw !important;height:100vh !important;z-index:2147483647 !important;cursor:crosshair !important;user-select:none !important;-webkit-user-select:none !important;background:rgba(15,23,42,0.42) !important;backdrop-filter:blur(1.5px) !important;display:block !important;';
    activeSnipOverlay = overlay;

    overlay.innerHTML = `
      <div class="__apertur_snip_banner__" style="position:fixed !important;top:18px !important;left:50% !important;transform:translateX(-50%) !important;display:inline-flex !important;align-items:center !important;gap:10px !important;padding:8px 16px !important;background:#0f172a !important;color:#f8fafc !important;border-radius:999px !important;font-size:13px !important;font-weight:600 !important;box-shadow:0 10px 25px -4px rgba(15,23,42,0.35) !important;pointer-events:auto !important;z-index:2147483647 !important;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif !important;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="6" cy="6" r="3"/>
          <circle cx="6" cy="18" r="3"/>
          <line x1="20" y1="4" x2="8.12" y2="15.88"/>
          <line x1="14.47" y1="14.48" x2="20" y2="20"/>
          <line x1="8.12" y1="8.12" x2="12" y2="12"/>
        </svg>
        <span>Click &amp; drag to crop an area • Press <kbd style="background:#334155;color:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:11px;">Esc</kbd> to cancel</span>
        <button type="button" class="__apertur_snip_close_btn__" id="__apertur_snip_cancel__" title="Cancel (Esc)" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:2px 4px;display:inline-flex;align-items:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div id="__apertur_snip_box__" style="position:fixed !important;display:none;border:2px solid #f59e0b !important;box-shadow:0 0 0 99999px rgba(15,23,42,0.52) !important;pointer-events:none !important;z-index:2147483647 !important;background:transparent !important;">
        <div class="__apertur_snip_dims__" id="__apertur_snip_dims__" style="position:absolute !important;top:-26px !important;left:0 !important;background:#0f172a !important;color:#f8fafc !important;font-family:monospace !important;font-size:11px !important;font-weight:700 !important;padding:2px 7px !important;border-radius:4px !important;white-space:nowrap !important;pointer-events:none !important;border:1px solid rgba(255,255,255,0.15) !important;">0 × 0 px</div>
      </div>
    `;

    document.documentElement.appendChild(overlay);

    const boxEl = overlay.querySelector('#__apertur_snip_box__');
    const dimsEl = overlay.querySelector('#__apertur_snip_dims__');
    const cancelBtn = overlay.querySelector('#__apertur_snip_cancel__');

    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    let toolbarEl = null;

    function cleanup() {
      window.removeEventListener('keydown', onKeyDown);
      if (overlay) overlay.remove();
      if (toolbarEl) toolbarEl.remove();
      activeSnipOverlay = null;
      isSnipActive = false;
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        cleanup();
      }
    }
    window.addEventListener('keydown', onKeyDown);

    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cleanup();
    });

    overlay.addEventListener('mousedown', (e) => {
      if (e.target.closest('.__apertur_snip_banner__') || e.target.closest('.__apertur_snip_toolbar__')) return;
      if (toolbarEl) {
        toolbarEl.remove();
        toolbarEl = null;
      }
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      currentX = startX;
      currentY = startY;

      boxEl.style.display = 'block';
      boxEl.style.left = `${startX}px`;
      boxEl.style.top = `${startY}px`;
      boxEl.style.width = '0px';
      boxEl.style.height = '0px';
      dimsEl.textContent = '0 × 0 px';
      e.preventDefault();
    });

    overlay.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      currentX = e.clientX;
      currentY = e.clientY;

      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      boxEl.style.left = `${left}px`;
      boxEl.style.top = `${top}px`;
      boxEl.style.width = `${width}px`;
      boxEl.style.height = `${height}px`;
      dimsEl.textContent = `${width} × ${height} px`;
    });

    overlay.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;

      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      if (width < 12 || height < 12) {
        boxEl.style.display = 'none';
        return;
      }

      showActionToolbar(left, top, width, height);
    });

    function showActionToolbar(left, top, width, height) {
      if (toolbarEl) toolbarEl.remove();

      toolbarEl = document.createElement('div');
      toolbarEl.className = '__apertur_snip_toolbar__';
      toolbarEl.innerHTML = `
        <button type="button" class="__apertur_snip_btn__ primary" id="__btn_snip_copy__" title="Copy cropped image to clipboard">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span>Copy</span>
        </button>
        <button type="button" class="__apertur_snip_btn__ secondary" id="__btn_snip_download__" title="Download PNG file">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Save PNG</span>
        </button>
        <button type="button" class="__apertur_snip_btn__ secondary" id="__btn_snip_library__" title="Save to Apertur Media Library">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
          <span>Library</span>
        </button>
        <button type="button" class="__apertur_snip_btn__ ghost" id="__btn_snip_discard__" title="Discard selection">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      `;

      const toolbarY = (top + height + 44 > window.innerHeight) ? Math.max(12, top - 46) : top + height + 8;
      const toolbarX = Math.max(12, Math.min(window.innerWidth - 300, left + width - 260));

      toolbarEl.style.left = `${toolbarX}px`;
      toolbarEl.style.top = `${toolbarY}px`;
      document.documentElement.appendChild(toolbarEl);

      const btnCopy = toolbarEl.querySelector('#__btn_snip_copy__');
      const btnDownload = toolbarEl.querySelector('#__btn_snip_download__');
      const btnLibrary = toolbarEl.querySelector('#__btn_snip_library__');
      const btnDiscard = toolbarEl.querySelector('#__btn_snip_discard__');

      btnDiscard.addEventListener('click', (e) => {
        e.stopPropagation();
        boxEl.style.display = 'none';
        toolbarEl.remove();
        toolbarEl = null;
      });

      async function executeCrop(mode) {
        overlay.style.display = 'none';
        toolbarEl.style.display = 'none';
        if (dockEl) dockEl.style.opacity = '0';
        if (haloEl) haloEl.style.opacity = '0';

        await new Promise((r) => setTimeout(r, 65));

        chrome.runtime.sendMessage({ action: 'CAPTURE_TAB_SCREENSHOT_REQUEST' }, async (res) => {
          const _ = chrome.runtime.lastError;
          if (dockEl) dockEl.style.opacity = '1';
          if (haloEl && currentOptions.enableHalo && hasMovedMouse) haloEl.style.opacity = '1';
          cleanup();

          if (!res || !res.success || !res.dataUrl) {
            showAperturToast(res?.error || 'Could not capture screenshot', 'info');
            return;
          }

          try {
            const img = await loadImageAsync(res.dataUrl);
            const dpr = window.devicePixelRatio || 1;
            const sx = Math.round(left * dpr);
            const sy = Math.round(top * dpr);
            const sw = Math.round(width * dpr);
            const sh = Math.round(height * dpr);

            const canvas = document.createElement('canvas');
            canvas.width = sw;
            canvas.height = sh;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

            canvas.toBlob(async (blob) => {
              const stamp = getTimestampString();
              const pageTitle = (document.title || 'Page Snip').replace(/[/\\?%*:|"<>]/g, '-').slice(0, 40);
              const dataUrl = canvas.toDataURL('image/png');

              // Always save to Media Library in background
              chrome.runtime.sendMessage({
                action: 'SAVE_SCREENSHOT_TO_LIBRARY_REQUEST',
                screenshot: {
                  id: 'snip-' + Date.now(),
                  title: `${pageTitle} (Crop)`,
                  timestamp: Date.now(),
                  dimensions: { width: sw, height: sh },
                  size: blob.size,
                  type: 'screenshot',
                  dataUrl
                }
              });

              if (mode === 'copy') {
                const copied = await copyBlobToClipboard(blob);
                if (copied) {
                  showAperturToast('✓ Snip copied to clipboard & saved!', 'success');
                } else {
                  downloadBlobFile(blob, `apertur-${pageTitle}-${stamp}.png`);
                  showAperturToast('Saved to Downloads & Library!', 'info');
                }
              } else if (mode === 'download') {
                downloadBlobFile(blob, `apertur-${pageTitle}-${stamp}.png`);
                showAperturToast('✓ Snip downloaded & saved to Library!', 'success');
              } else if (mode === 'library') {
                showAperturToast('✓ Snip saved to Media Library!', 'success');
              }
            }, 'image/png');
          } catch (err) {
            console.error('Error cropping snip:', err);
            showAperturToast('Failed to crop snip: ' + err.message, 'info');
          }
        });
      }

      btnCopy.addEventListener('click', () => executeCrop('copy'));
      btnDownload.addEventListener('click', () => executeCrop('download'));
      btnLibrary.addEventListener('click', () => executeCrop('library'));
    }
  }

  async function startFullPageScreenshot(options = {}) {
    const origScrollX = window.scrollX;
    const origScrollY = window.scrollY;

    const progressEl = document.createElement('div');
    progressEl.id = '__apertur_fullpage_progress__';
    progressEl.style.cssText = 'position:fixed !important;top:24px !important;left:50% !important;transform:translateX(-50%) !important;display:flex !important;align-items:center !important;gap:12px !important;padding:10px 20px !important;background:rgba(15,23,42,0.94) !important;color:#f8fafc !important;border-radius:12px !important;box-shadow:0 16px 36px -8px rgba(15,23,42,0.4) !important;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif !important;font-size:13px !important;font-weight:600 !important;z-index:2147483647 !important;pointer-events:none !important;';
    progressEl.innerHTML = `
      <span id="__apertur_progress_label__">Capturing full page... 0%</span>
      <div class="__apertur_progress_bar_wrap__">
        <div class="__apertur_progress_bar_fill__" id="__apertur_progress_fill__"></div>
      </div>
    `;
    document.documentElement.appendChild(progressEl);

    const labelEl = progressEl.querySelector('#__apertur_progress_label__');
    const fillEl = progressEl.querySelector('#__apertur_progress_fill__');

    if (dockEl) dockEl.style.display = 'none';
    if (haloEl) haloEl.style.display = 'none';

    try {
      const doc = document.documentElement;
      const body = document.body;
      const fullWidth = Math.max(doc.scrollWidth, body ? body.scrollWidth : 0, doc.clientWidth);
      const fullHeight = Math.max(doc.scrollHeight, body ? body.scrollHeight : 0, doc.clientHeight);
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      const maxDim = 16384;
      const targetW = Math.min(windowWidth * dpr, maxDim);
      const targetH = Math.min(fullHeight * dpr, maxDim);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      const yPositions = [];
      let y = 0;
      while (y < fullHeight) {
        yPositions.push(y);
        if (y + windowHeight >= fullHeight) break;
        y += windowHeight;
      }

      for (let i = 0; i < yPositions.length; i++) {
        const curY = yPositions[i];
        window.scrollTo({ left: 0, top: curY, behavior: 'instant' });

        const pct = Math.round(((i + 1) / yPositions.length) * 100);
        if (labelEl) labelEl.textContent = `Capturing full page... ${pct}%`;
        if (fillEl) fillEl.style.width = `${pct}%`;

        await new Promise((r) => setTimeout(r, 200));

        progressEl.style.display = 'none';
        await new Promise((r) => setTimeout(r, 40));

        const res = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'CAPTURE_TAB_SCREENSHOT_REQUEST' }, resolve);
        });

        progressEl.style.display = 'flex';

        if (!res || !res.success || !res.dataUrl) {
          throw new Error(res?.error || 'Failed capturing slice at scroll position ' + curY);
        }

        const img = await loadImageAsync(res.dataUrl);
        const isLast = (i === yPositions.length - 1);

        if (isLast && (fullHeight - curY) < windowHeight) {
          const remainder = fullHeight - curY;
          const srcY = (windowHeight - remainder) * dpr;
          const srcH = remainder * dpr;
          ctx.drawImage(img, 0, srcY, targetW, srcH, 0, curY * dpr, targetW, srcH);
        } else {
          const sliceH = Math.min(windowHeight * dpr, targetH - curY * dpr);
          ctx.drawImage(img, 0, 0, targetW, sliceH, 0, curY * dpr, targetW, sliceH);
        }
      }

      window.scrollTo(origScrollX, origScrollY);
      progressEl.remove();
      if (dockEl) dockEl.style.display = 'flex';
      if (haloEl && currentOptions.enableHalo) haloEl.style.display = 'block';

      canvas.toBlob(async (blob) => {
        const stamp = getTimestampString();
        const pageTitle = (document.title || 'Full Page').replace(/[/\\?%*:|"<>]/g, '-').slice(0, 40);
        const dataUrl = canvas.toDataURL('image/png');

        // Always save full page to Media Library
        chrome.runtime.sendMessage({
          action: 'SAVE_SCREENSHOT_TO_LIBRARY_REQUEST',
          screenshot: {
            id: 'full-' + Date.now(),
            title: `${pageTitle} (Full Page)`,
            timestamp: Date.now(),
            dimensions: { width: targetW, height: targetH },
            size: blob.size,
            type: 'screenshot',
            dataUrl
          }
        });

        let copied = false;
        if (options.copyToClipboard) {
          copied = await copyBlobToClipboard(blob);
        }
        if (options.download !== false) {
          downloadBlobFile(blob, `apertur-${pageTitle}-fullpage-${stamp}.png`);
        }

        if (copied) {
          showAperturToast('✓ Full page copied to clipboard, downloaded & saved!', 'success', 3500);
        } else {
          showAperturToast('✓ Full page screenshot saved to Downloads & Library!', 'success', 3500);
        }
      }, 'image/png');

    } catch (err) {
      console.error('Error in full page capture:', err);
      window.scrollTo(origScrollX, origScrollY);
      if (progressEl) progressEl.remove();
      if (dockEl) dockEl.style.display = 'flex';
      if (haloEl && currentOptions.enableHalo) haloEl.style.display = 'block';
      showAperturToast('Full page capture failed: ' + err.message, 'info');
    }
  }

  // Message Listener (supports countdown, cursor fx, and screenshot suite)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'SHOW_COUNTDOWN_OVERLAY') {
      showCountdownOverlay(Number(message.seconds) || 3);
      sendResponse({ ok: true });
    } else if (message.action === 'START_CURSOR_EFFECTS' || message.action === 'ENABLE_CURSOR_FX') {
      activateEffects(message.options || {}, message.startTime, message.isPaused);
      sendResponse({ ok: true });
    } else if (message.action === 'STOP_CURSOR_EFFECTS' || message.action === 'DISABLE_CURSOR_FX') {
      deactivateEffects();
      sendResponse({ ok: true });
    } else if (message.action === 'TRIGGER_VISIBLE_SCREENSHOT') {
      captureVisibleScreenshot(message.options || {});
      sendResponse({ ok: true });
    } else if (message.action === 'START_AREA_SELECTION') {
      startAreaSnipping(message.options || {});
      sendResponse({ ok: true });
    } else if (message.action === 'START_FULL_PAGE_SCREENSHOT') {
      startFullPageScreenshot(message.options || {});
      sendResponse({ ok: true });
    }
  });

  // Self-Check on Page Navigation: Restore HUD & Cursor FX automatically
  try {
    chrome.runtime.sendMessage({ action: 'GET_STATUS_REQUEST' }, (state) => {
      if (chrome.runtime.lastError) return;
      if (state && state.isRecording) {
        activateEffects(state.options || {}, state.startTime, state.isPaused);
      }
    });
  } catch (_) {}
}

