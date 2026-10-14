/**
 * Studio Grade Cursor Highlighter, Click Shockwaves & Floating Dock
 */
(() => {
  if (window.__tabRecorderContentInjected) return;
  window.__tabRecorderContentInjected = true;

  let active = false;
  let options = {
    enableHalo: true,
    enableClickRipple: true,
    showFloatingDock: true,
    theme: 'yellow' // 'yellow', 'cyan', 'violet', 'red', 'green'
  };

  let hostElement = null;
  let haloElement = null;
  let floatingDock = null;
  let dockTimerInterval = null;
  let recordingStartTime = Date.now();
  let isPaused = false;

  let targetX = -100;
  let targetY = -100;
  let currentX = -100;
  let currentY = -100;
  let rafId = null;

  // Initialize Host Container
  function initHost() {
    if (hostElement) return;

    hostElement = document.createElement('div');
    hostElement.id = 'tab-recorder-cursor-host';
    (document.body || document.documentElement).appendChild(hostElement);

    if (options.enableHalo) {
      createHalo();
    }
  }

  function createHalo() {
    if (haloElement || !hostElement) return;

    haloElement = document.createElement('div');
    haloElement.className = `tab-rec-cursor-halo theme-${options.theme}`;
    haloElement.style.display = 'none';
    hostElement.appendChild(haloElement);
  }

  function removeHalo() {
    if (haloElement) {
      haloElement.remove();
      haloElement = null;
    }
  }

  // Smooth cinematic cursor interpolation
  function updateCursorMotion() {
    if (!active) return;

    // Smooth Lerp tracking
    const dx = targetX - currentX;
    const dy = targetY - currentY;

    currentX += dx * 0.92;
    currentY += dy * 0.92;

    if (haloElement) {
      haloElement.style.left = `${currentX}px`;
      haloElement.style.top = `${currentY}px`;
    }

    rafId = requestAnimationFrame(updateCursorMotion);
  }

  function handleMouseMove(e) {
    targetX = e.clientX;
    targetY = e.clientY;

    if (haloElement && haloElement.style.display === 'none') {
      currentX = targetX;
      currentY = targetY;
      haloElement.style.display = 'block';
    }
  }

  // Multi-Ring Shockwave Generator on Click
  function handleMouseDown(e) {
    if (!active) return;

    if (haloElement) {
      haloElement.classList.add('is-pressed');
    }

    if (options.enableClickRipple && hostElement) {
      createShockwaves(e.clientX, e.clientY, e.button);
    }
  }

  function handleMouseUp() {
    if (haloElement) {
      haloElement.classList.remove('is-pressed');
    }
  }

  function handleMouseLeave() {
    if (haloElement) {
      haloElement.style.display = 'none';
    }
  }

  function createShockwaves(x, y, button) {
    const isRightClick = button === 2;
    const themeClass = `theme-${options.theme}`;
    const clickTypeClass = isRightClick ? 'right-click' : '';

    // 1. Sharp Expanding Ring
    const ring = document.createElement('div');
    ring.className = `tab-rec-shockwave ring ${themeClass} ${clickTypeClass}`;
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;

    // 2. Soft Glowing Bloom Wave
    const bloom = document.createElement('div');
    bloom.className = `tab-rec-shockwave bloom ${themeClass} ${clickTypeClass}`;
    bloom.style.left = `${x}px`;
    bloom.style.top = `${y}px`;

    hostElement.appendChild(ring);
    hostElement.appendChild(bloom);

    ring.addEventListener('animationend', () => ring.remove());
    bloom.addEventListener('animationend', () => bloom.remove());
  }

  // --------------------------------------------------------------------------
  // Floating Glass Recording Dock
  // --------------------------------------------------------------------------
  function createFloatingDock() {
    if (floatingDock || !options.showFloatingDock) return;

    floatingDock = document.createElement('div');
    floatingDock.id = 'tab-rec-floating-dock';
    floatingDock.innerHTML = `
      <div class="tab-rec-dock-handle" title="Drag to move dock"></div>
      <div class="tab-rec-dock-rec">
        <span class="tab-rec-dock-dot"></span>
        <span class="tab-rec-dock-time" id="tabRecDockTimer">00:00:00</span>
      </div>
      <span class="tab-rec-dock-res">1080p</span>
      <button class="tab-rec-dock-btn" id="btnDockPause" title="Pause / Resume">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1"/>
          <rect x="14" y="4" width="4" height="16" rx="1"/>
        </svg>
      </button>
      <button class="tab-rec-dock-btn stop" id="btnDockStop" title="Stop & Save Recording">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <rect x="5" y="5" width="14" height="14" rx="2"/>
        </svg>
      </button>
    `;

    document.body.appendChild(floatingDock);

    // Make Dock Draggable
    setupDockDrag(floatingDock);

    // Controls
    const btnDockPause = floatingDock.querySelector('#btnDockPause');
    const btnDockStop = floatingDock.querySelector('#btnDockStop');

    btnDockPause.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isPaused) {
        chrome.runtime.sendMessage({ action: 'RESUME_RECORDING_REQUEST' }, () => {
          isPaused = false;
          btnDockPause.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          `;
        });
      } else {
        chrome.runtime.sendMessage({ action: 'PAUSE_RECORDING_REQUEST' }, () => {
          isPaused = true;
          btnDockPause.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          `;
        });
      }
    });

    btnDockStop.addEventListener('click', (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage({ action: 'STOP_RECORDING_REQUEST' });
    });

    // Start Live Dock Timer
    startDockTimer();
  }

  function removeFloatingDock() {
    if (dockTimerInterval) {
      clearInterval(dockTimerInterval);
      dockTimerInterval = null;
    }
    if (floatingDock) {
      floatingDock.remove();
      floatingDock = null;
    }
  }

  function startDockTimer() {
    if (dockTimerInterval) clearInterval(dockTimerInterval);
    const timerEl = floatingDock ? floatingDock.querySelector('#tabRecDockTimer') : null;

    dockTimerInterval = setInterval(() => {
      if (!timerEl || isPaused) return;
      const elapsed = Math.max(0, Date.now() - recordingStartTime);
      const totalSec = Math.floor(elapsed / 1000);
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      timerEl.textContent = [
        hrs.toString().padStart(2, '0'),
        mins.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0')
      ].join(':');
    }, 1000);
  }

  function setupDockDrag(el) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initLeft = 0;
    let initTop = 0;

    el.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = el.getBoundingClientRect();
      initLeft = rect.left;
      initTop = rect.top;

      el.style.left = `${initLeft}px`;
      el.style.top = `${initTop}px`;
      el.style.bottom = 'auto';
      el.style.right = 'auto';

      document.addEventListener('mousemove', onDragMove);
      document.addEventListener('mouseup', onDragEnd);
      e.preventDefault();
    });

    function onDragMove(e) {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      el.style.left = `${Math.max(10, Math.min(window.innerWidth - el.offsetWidth - 10, initLeft + dx))}px`;
      el.style.top = `${Math.max(10, Math.min(window.innerHeight - el.offsetHeight - 10, initTop + dy))}px`;
    }

    function onDragEnd() {
      isDragging = false;
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
    }
  }

  // --------------------------------------------------------------------------
  // Lifecycle Management
  // --------------------------------------------------------------------------
  function start(opts = {}) {
    options = { ...options, ...opts };
    active = true;
    recordingStartTime = opts.startTime || Date.now();
    isPaused = false;

    initHost();

    if (options.enableHalo && !haloElement) {
      createHalo();
    } else if (!options.enableHalo && haloElement) {
      removeHalo();
    }

    if (haloElement) {
      haloElement.className = `tab-rec-cursor-halo theme-${options.theme}`;
    }

    // Attach listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    if (!rafId) {
      rafId = requestAnimationFrame(updateCursorMotion);
    }

    // Floating in-tab controls
    createFloatingDock();
  }

  function stop() {
    active = false;

    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mouseleave', handleMouseLeave);

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    if (hostElement) {
      hostElement.remove();
      hostElement = null;
      haloElement = null;
    }

    removeFloatingDock();
  }

  // Listen for messages from background/popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'START_CURSOR_EFFECTS') {
      start(message.options);
      sendResponse({ status: 'ok' });
    } else if (message.action === 'STOP_CURSOR_EFFECTS') {
      stop();
      sendResponse({ status: 'ok' });
    } else if (message.action === 'UPDATE_CURSOR_OPTIONS') {
      options = { ...options, ...message.options };
      if (haloElement) {
        haloElement.className = `tab-rec-cursor-halo theme-${options.theme}`;
        if (!options.enableHalo) removeHalo();
      } else if (options.enableHalo && hostElement) {
        createHalo();
      }
      sendResponse({ status: 'ok' });
    }
  });

  // Auto-sync on reload
  chrome.storage.local.get(['isRecording', 'recordingStartTime', 'cursorSettings'], (result) => {
    if (result.isRecording) {
      chrome.runtime.sendMessage({ action: 'CHECK_RECORDING_TAB' }, (resp) => {
        if (resp && resp.isCurrentTab) {
          start({
            ...(result.cursorSettings || {}),
            startTime: result.recordingStartTime
          });
        }
      });
    }
  });
})();
