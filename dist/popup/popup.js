/**
 * Studio Controller for Tab Recorder HD Popup
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const configView = document.getElementById('configView');
  const recordingView = document.getElementById('recordingView');
  const errorBanner = document.getElementById('errorBanner');
  const errorMessage = document.getElementById('errorMessage');
  const btnDismissError = document.getElementById('btnDismissError');

  const btnStart = document.getElementById('btnStart');
  const btnStop = document.getElementById('btnStop');
  const btnPauseResume = document.getElementById('btnPauseResume');
  const pauseResumeText = document.getElementById('pauseResumeText');
  const pauseResumeIcon = document.getElementById('pauseResumeIcon');
  const recordingTimer = document.getElementById('recordingTimer');
  const recordingMeta = document.getElementById('recordingMeta');
  const btnHistory = document.getElementById('btnHistory');

  const qualityCards = document.querySelectorAll('.quality-card');
  const checkTabAudio = document.getElementById('checkTabAudio');
  const checkMic = document.getElementById('checkMic');
  const checkHalo = document.getElementById('checkHalo');
  const checkClickRipple = document.getElementById('checkClickRipple');
  const checkFloatingDock = document.getElementById('checkFloatingDock');
  const checkCountdown = document.getElementById('checkCountdown');
  const btnQuickScreenshot = document.getElementById('btnQuickScreenshot');
  const quickSnapText = document.getElementById('quickSnapText');
  const themeButtons = document.querySelectorAll('.theme-btn');
  const testClickArea = document.getElementById('testClickArea');
  const scopeCards = document.querySelectorAll('.mode-option, .scope-card');

  // State
  let timerInterval = null;
  let selectedScope = 'continuous';
  let selectedQuality = '1080p60';
  let selectedTheme = 'yellow';

  // Load preferences
  const saved = await chrome.storage.local.get([
    'prefScope',
    'prefQuality',
    'prefTabAudio',
    'prefMic',
    'prefHalo',
    'prefClickRipple',
    'prefFloatingDock',
    'prefCountdown',
    'prefTheme'
  ]);

  const scopeGuideText = document.getElementById('scopeGuideText');

  function updateScopeGuide(scope) {
    if (!scopeGuideText) return;
    if (scope === 'continuous') {
      scopeGuideText.textContent = 'Select Chrome Window: survives all clicks, logins & redirects';
    } else if (scope === 'screen') {
      scopeGuideText.textContent = 'Captures entire desktop display across all windows & apps';
    } else if (scope === 'tab') {
      scopeGuideText.textContent = 'Direct 1-click active tab capture (stops if tab redirects)';
    }
  }

  if (saved.prefScope) {
    selectedScope = saved.prefScope;
  }
  scopeCards.forEach(card => card.classList.toggle('active', card.dataset.scope === selectedScope));
  updateScopeGuide(selectedScope);

  scopeCards.forEach(card => {
    card.addEventListener('click', () => {
      scopeCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedScope = card.dataset.scope;
      updateScopeGuide(selectedScope);
      chrome.storage.local.set({ prefScope: selectedScope });
    });
  });

  if (saved.prefQuality) {
    selectedQuality = saved.prefQuality;
    qualityCards.forEach(card => card.classList.toggle('active', card.dataset.quality === selectedQuality));
  }
  if (saved.prefTabAudio !== undefined) checkTabAudio.checked = saved.prefTabAudio;
  if (saved.prefMic !== undefined) checkMic.checked = saved.prefMic;
  if (saved.prefHalo !== undefined) {
    checkHalo.checked = saved.prefHalo;
    checkClickRipple.checked = saved.prefHalo;
  }
  if (saved.prefFloatingDock !== undefined && checkFloatingDock) checkFloatingDock.checked = saved.prefFloatingDock;
  if (saved.prefCountdown !== undefined && checkCountdown) checkCountdown.checked = saved.prefCountdown;
  if (saved.prefTheme) {
    selectedTheme = saved.prefTheme;
    themeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.theme === selectedTheme));
  }

  // Quality Cards Event
  qualityCards.forEach(card => {
    card.addEventListener('click', () => {
      qualityCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedQuality = card.dataset.quality;
      chrome.storage.local.set({ prefQuality: selectedQuality });
      updateButtonSpec();
    });
  });

  function updateButtonSpec() {
    const subtext = btnStart.querySelector('.btn-subtext');
    if (!subtext) return;
    if (selectedQuality === '1080p60') subtext.textContent = '1920 × 1080 • 60 FPS';
    else if (selectedQuality === '1080p30') subtext.textContent = '1920 × 1080 • 30 FPS';
    else if (selectedQuality === '720p60') subtext.textContent = '1280 × 720 • 60 FPS';
  }
  updateButtonSpec();

  // Interactive Sandbox Demo
  const themeColors = {
    yellow: { ring: '#f59e0b', bloom: 'rgba(245, 158, 11, 0.25)' },
    cyan:   { ring: '#06b6d4', bloom: 'rgba(6, 182, 212, 0.25)' },
    violet: { ring: '#8b5cf6', bloom: 'rgba(139, 92, 246, 0.25)' },
    red:    { ring: '#e11d48', bloom: 'rgba(225, 29, 72, 0.25)' },
    green:  { ring: '#10b981', bloom: 'rgba(16, 185, 129, 0.25)' }
  };

  const popupPreviewHalo = document.getElementById('popupPreviewHalo');

  function syncPreviewHaloTheme() {
    if (!popupPreviewHalo) return;
    const color = themeColors[selectedTheme] || themeColors.yellow;
    popupPreviewHalo.style.borderColor = color.ring;
    popupPreviewHalo.style.background = color.bloom;
    popupPreviewHalo.style.boxShadow = `0 0 14px ${color.bloom}`;
  }
  syncPreviewHaloTheme();

  // Themes Event
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      themeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTheme = btn.dataset.theme;
      syncPreviewHaloTheme();
      chrome.storage.local.set({ prefTheme: selectedTheme });
    });
  });

  // Toggles Persist
  checkTabAudio.addEventListener('change', () => chrome.storage.local.set({ prefTabAudio: checkTabAudio.checked }));
  checkMic.addEventListener('change', () => chrome.storage.local.set({ prefMic: checkMic.checked }));
  checkHalo.addEventListener('change', () => {
    checkClickRipple.checked = checkHalo.checked;
    chrome.storage.local.set({
      prefHalo: checkHalo.checked,
      prefClickRipple: checkHalo.checked
    });
  });
  checkClickRipple.addEventListener('change', () => chrome.storage.local.set({ prefClickRipple: checkClickRipple.checked }));
  if (checkFloatingDock) {
    checkFloatingDock.addEventListener('change', () => chrome.storage.local.set({ prefFloatingDock: checkFloatingDock.checked }));
  }
  if (checkCountdown) {
    checkCountdown.addEventListener('change', () => chrome.storage.local.set({ prefCountdown: checkCountdown.checked }));
  }

  if (btnQuickScreenshot) {
    btnQuickScreenshot.addEventListener('click', () => {
      if (quickSnapText) quickSnapText.textContent = 'Saving...';
      chrome.runtime.sendMessage({ action: 'CAPTURE_TAB_SCREENSHOT_REQUEST' }, (res) => {
        if (res && res.success && res.dataUrl) {
          const a = document.createElement('a');
          a.href = res.dataUrl;
          const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          a.download = `apertur-screenshot-${stamp}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          if (quickSnapText) {
            quickSnapText.textContent = 'Saved PNG!';
            setTimeout(() => {
              if (quickSnapText) quickSnapText.textContent = 'Screenshot';
            }, 1400);
          }
        } else {
          if (quickSnapText) quickSnapText.textContent = 'Screenshot';
          showError(res?.error || 'Switch to a regular website tab to take a screenshot.');
        }
      });
    });
  }

  if (testClickArea) {
    testClickArea.addEventListener('mousemove', (e) => {
      if (!popupPreviewHalo) return;
      const rect = testClickArea.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      popupPreviewHalo.style.opacity = '1';
      popupPreviewHalo.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });

    testClickArea.addEventListener('mouseleave', () => {
      if (popupPreviewHalo) popupPreviewHalo.style.opacity = '0';
    });

    testClickArea.addEventListener('pointerdown', (e) => {
      const rect = testClickArea.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const color = themeColors[selectedTheme] || themeColors.yellow;

      const shock = document.createElement('div');
      shock.style.position = 'absolute';
      shock.style.left = `${x}px`;
      shock.style.top = `${y}px`;
      shock.style.width = '12px';
      shock.style.height = '12px';
      shock.style.borderRadius = '50%';
      shock.style.border = `2px solid ${color.ring}`;
      shock.style.background = color.bloom;
      shock.style.boxShadow = `0 0 14px ${color.ring}`;
      shock.style.pointerEvents = 'none';
      shock.style.transform = 'translate(-50%, -50%) scale(0.2)';
      shock.style.transition = 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)';

      testClickArea.appendChild(shock);

      requestAnimationFrame(() => {
        shock.style.transform = 'translate(-50%, -50%) scale(4.8)';
        shock.style.opacity = '0';
      });

      setTimeout(() => shock.remove(), 450);
    });
  }

  const btnResetTabLock = document.getElementById('btnResetTabLock');

  function showError(msg) {
    if (msg.includes('ACTIVE_STREAM_LOCKED') || msg.includes('active stream')) {
      errorMessage.textContent = 'Chrome has locked this tab from a previous stream.';
      if (btnResetTabLock) btnResetTabLock.classList.remove('hidden');
    } else if (msg.includes('cancelled') || msg.includes('canceled')) {
      errorMessage.textContent = 'Sharing was cancelled. Click "Start Recording" to try again.';
      if (btnResetTabLock) btnResetTabLock.classList.add('hidden');
    } else {
      errorMessage.textContent = msg;
      if (btnResetTabLock) btnResetTabLock.classList.add('hidden');
    }
    errorBanner.classList.remove('hidden');
  }

  if (btnResetTabLock) {
    btnResetTabLock.addEventListener('click', () => {
      btnResetTabLock.textContent = 'Unlocking...';
      btnResetTabLock.disabled = true;
      chrome.runtime.sendMessage({ action: 'RESET_TAB_LOCK_REQUEST' }, () => {
        errorBanner.classList.add('hidden');
        window.close();
      });
    });
  }

  btnDismissError.addEventListener('click', () => {
    errorBanner.classList.add('hidden');
  });

  // History / Gallery Launcher
  btnHistory.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('preview/preview.html?view=gallery') });
  });

  // Landing Page Launcher
  const btnLanding = document.getElementById('btnLanding');
  if (btnLanding) {
    btnLanding.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('landing/index.html') });
    });
  }

  // Status check
  chrome.runtime.sendMessage({ action: 'GET_STATUS_REQUEST' }, (state) => {
    if (state && state.isRecording) {
      showRecordingView(state);
    } else {
      showConfigView();
    }
  });

  function showConfigView() {
    configView.classList.remove('hidden');
    recordingView.classList.add('hidden');
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function showRecordingView(state) {
    configView.classList.add('hidden');
    recordingView.classList.remove('hidden');
    errorBanner.classList.add('hidden');

    const res = state.options?.resolution || '1080p';
    const fps = state.options?.fps || 60;
    const width = res === '720p' ? '1280 × 720' : '1920 × 1080';
    const bitrate = (res === '1080p' && fps >= 60) ? '12 Mbps' : '8 Mbps';

    let mode = 'Window Workflow';
    if (state.options?.captureMode === 'screen') mode = 'Entire Screen';
    else if (state.options?.captureMode === 'tab') mode = 'Static Tab';

    recordingMeta.innerHTML = `
      <span class="spec-pill">${width}</span>
      <span class="spec-pill">${fps} FPS</span>
      <span class="spec-pill">${mode}</span>
      <span class="spec-pill accent">${bitrate}</span>
    `;

    updatePauseResumeButton(state.isPaused);
    startTimer(state.startTime || Date.now());
  }

  function updatePauseResumeButton(isPaused) {
    const liveStatusLabel = document.getElementById('liveStatusLabel');
    if (isPaused) {
      pauseResumeIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>`;
      pauseResumeText.textContent = 'Resume';
      if (liveStatusLabel) liveStatusLabel.textContent = 'RECORDING PAUSED';
    } else {
      pauseResumeIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`;
      pauseResumeText.textContent = 'Pause';
      if (liveStatusLabel) liveStatusLabel.textContent = 'RECORDING IN PROGRESS';
    }
  }

  function startTimer(startTime) {
    if (timerInterval) clearInterval(timerInterval);

    function tick() {
      const elapsed = Math.max(0, Date.now() - startTime);
      const totalSec = Math.floor(elapsed / 1000);
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      recordingTimer.textContent = [
        hrs.toString().padStart(2, '0'),
        mins.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0')
      ].join(':');
    }

    tick();
    timerInterval = setInterval(tick, 1000);
  }

  // Start Action
  btnStart.addEventListener('click', async () => {
    btnStart.disabled = true;
    errorBanner.classList.add('hidden');
    const mainLabel = btnStart.querySelector('.btn-main-label');
    const useCountdown = checkCountdown ? checkCountdown.checked : false;
    if (mainLabel) {
      mainLabel.textContent = useCountdown ? 'Select & Get Ready (3s)...' : 'Starting...';
    }

    let resolution = '1080p';
    let fps = 60;
    if (selectedQuality === '1080p30') fps = 30;
    else if (selectedQuality === '720p60') { resolution = '720p'; fps = 60; }

    const options = {
      captureMode: selectedScope || 'continuous',
      resolution,
      fps,
      includeTabAudio: checkTabAudio.checked,
      includeMic: checkMic.checked,
      enableHalo: checkHalo.checked,
      enableClickRipple: checkClickRipple.checked,
      showFloatingDock: checkFloatingDock ? checkFloatingDock.checked : true,
      enableCountdown: useCountdown,
      cursorTheme: selectedTheme
    };

    chrome.runtime.sendMessage({
      action: 'START_RECORDING_REQUEST',
      options
    }, (response) => {
      btnStart.disabled = false;
      if (mainLabel) mainLabel.textContent = 'Start Recording';
      if (response && response.success) {
        showRecordingView({
          startTime: Date.now(),
          options,
          isPaused: false
        });
      } else {
        const err = response?.error || 'Failed to start recording.';
        showError(err);
      }
    });
  });

  // Stop Action
  btnStop.addEventListener('click', () => {
    btnStop.disabled = true;
    const labelSpan = btnStop.querySelector('span:last-child');
    if (labelSpan) labelSpan.textContent = 'Saving...';

    chrome.runtime.sendMessage({ action: 'STOP_RECORDING_REQUEST' }, () => {
      btnStop.disabled = false;
      showConfigView();
      setTimeout(() => window.close(), 300);
    });
  });

  // Pause / Resume Action
  btnPauseResume.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'GET_STATUS_REQUEST' }, (state) => {
      if (!state || !state.isRecording) return;
      if (state.isPaused) {
        chrome.runtime.sendMessage({ action: 'RESUME_RECORDING_REQUEST' }, () => updatePauseResumeButton(false));
      } else {
        chrome.runtime.sendMessage({ action: 'PAUSE_RECORDING_REQUEST' }, () => updatePauseResumeButton(true));
      }
    });
  });
});
