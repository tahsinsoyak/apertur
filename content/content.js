/**
 * Screencast Cursor Highlight & Click Ripple Content Script
 */
(() => {
  // Prevent duplicate script execution
  if (window.__tabRecorderContentInjected) return;
  window.__tabRecorderContentInjected = true;

  let active = false;
  let options = {
    enableHalo: true,
    enableClickRipple: true,
    theme: 'yellow' // 'yellow', 'cyan', 'red', 'green'
  };

  let hostElement = null;
  let haloElement = null;
  let mouseX = -100;
  let mouseY = -100;
  let currentX = -100;
  let currentY = -100;
  let rafId = null;

  function initHost() {
    if (hostElement) return;

    hostElement = document.createElement('div');
    hostElement.id = 'tab-recorder-cursor-host';
    document.documentElement.appendChild(hostElement);

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

  function updateHaloPosition() {
    if (!active) return;

    // Linear interpolation for silky smooth movement
    const dx = mouseX - currentX;
    const dy = mouseY - currentY;
    
    // Snappy tracking
    currentX += dx * 0.95;
    currentY += dy * 0.95;

    if (haloElement) {
      haloElement.style.left = `${currentX}px`;
      haloElement.style.top = `${currentY}px`;
    }

    rafId = requestAnimationFrame(updateHaloPosition);
  }

  function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (haloElement && haloElement.style.display === 'none') {
      currentX = mouseX;
      currentY = mouseY;
      haloElement.style.display = 'block';
    }
  }

  function handleMouseDown(e) {
    if (!active) return;

    // Scale effect on halo while pressed
    if (haloElement) {
      haloElement.classList.add('is-pressed');
    }

    if (options.enableClickRipple && hostElement) {
      createClickRipple(e.clientX, e.clientY, e.button);
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

  function createClickRipple(x, y, button) {
    const ripple = document.createElement('div');
    const isRightClick = button === 2;
    ripple.className = `tab-rec-click-ripple theme-${options.theme} ${isRightClick ? 'right-click' : ''}`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    hostElement.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }

  function start(opts = {}) {
    options = { ...options, ...opts };
    active = true;

    initHost();

    if (options.enableHalo && !haloElement) {
      createHalo();
    } else if (!options.enableHalo && haloElement) {
      removeHalo();
    }

    if (haloElement) {
      haloElement.className = `tab-rec-cursor-halo theme-${options.theme}`;
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    if (!rafId) {
      rafId = requestAnimationFrame(updateHaloPosition);
    }
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
  }

  // Handle messages from background/popup
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
        if (!options.enableHalo) {
          removeHalo();
        }
      } else if (options.enableHalo && hostElement) {
        createHalo();
      }
      sendResponse({ status: 'ok' });
    }
  });

  // Check state on script initialization
  chrome.storage.local.get(['isRecording', 'recordingTabId', 'cursorSettings'], (result) => {
    if (result.isRecording) {
      chrome.runtime.sendMessage({ action: 'CHECK_RECORDING_TAB' }, (resp) => {
        if (resp && resp.isCurrentTab) {
          start(result.cursorSettings || {});
        }
      });
    }
  });
})();
