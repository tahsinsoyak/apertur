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
      <button type="button" class="__tr_dock_btn__ snap-btn" id="__tr_btn_screenshot__" title="Save PNG screenshot of this page">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span id="__tr_snap_label__">Snap</span>
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

    // Controls
    const btnScreenshot = dockEl.querySelector('#__tr_btn_screenshot__');
    const btnPause = dockEl.querySelector('#__tr_btn_pause__');
    const btnStop = dockEl.querySelector('#__tr_btn_stop__');
    const btnHide = dockEl.querySelector('#__tr_btn_hide__');

    if (btnScreenshot) {
      btnScreenshot.addEventListener('click', (e) => {
        e.stopPropagation();
        const snapLabel = dockEl ? dockEl.querySelector('#__tr_snap_label__') : null;
        if (dockEl) dockEl.style.opacity = '0';
        setTimeout(() => {
          chrome.runtime.sendMessage({ action: 'CAPTURE_TAB_SCREENSHOT_REQUEST' }, (res) => {
            if (dockEl) dockEl.style.opacity = '1';
            if (res && res.success && res.dataUrl) {
              const a = document.createElement('a');
              a.href = res.dataUrl;
              const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
              a.download = `apertur-screenshot-${stamp}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              if (snapLabel) {
                snapLabel.textContent = 'Saved!';
                setTimeout(() => {
                  if (snapLabel) snapLabel.textContent = 'Snap';
                }, 1400);
              }
            }
          });
        }, 70);
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

  // Message Listener (supports both START_CURSOR_EFFECTS and ENABLE_CURSOR_FX)
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
