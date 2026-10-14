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
  const themeButtons = document.querySelectorAll('.theme-btn');
  const testClickArea = document.getElementById('testClickArea');

  // State
  let timerInterval = null;
  let selectedQuality = '1080p60';
  let selectedTheme = 'yellow';

  // Load preferences
  const saved = await chrome.storage.local.get([
    'prefQuality',
    'prefTabAudio',
    'prefMic',
    'prefHalo',
    'prefClickRipple',
    'prefFloatingDock',
    'prefTheme'
  ]);

  if (saved.prefQuality) {
    selectedQuality = saved.prefQuality;
    qualityCards.forEach(card => card.classList.toggle('active', card.dataset.quality === selectedQuality));
  }
  if (saved.prefTabAudio !== undefined) checkTabAudio.checked = saved.prefTabAudio;
  if (saved.prefMic !== undefined) checkMic.checked = saved.prefMic;
  if (saved.prefHalo !== undefined) checkHalo.checked = saved.prefHalo;
  if (saved.prefClickRipple !== undefined) checkClickRipple.checked = saved.prefClickRipple;
  if (saved.prefFloatingDock !== undefined && checkFloatingDock) checkFloatingDock.checked = saved.prefFloatingDock;
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
    if (selectedQuality === '1080p60') subtext.textContent = '1920 × 1080 • 60 FPS';
    else if (selectedQuality === '1080p30') subtext.textContent = '1920 × 1080 • 30 FPS';
    else if (selectedQuality === '720p60') subtext.textContent = '1280 × 720 • 60 FPS';
  }
  updateButtonSpec();

  // Themes Event
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      themeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTheme = btn.dataset.theme;
      chrome.storage.local.set({ prefTheme: selectedTheme });
    });
  });

  // Toggles Persist
  checkTabAudio.addEventListener('change', () => chrome.storage.local.set({ prefTabAudio: checkTabAudio.checked }));
  checkMic.addEventListener('change', () => chrome.storage.local.set({ prefMic: checkMic.checked }));
  checkHalo.addEventListener('change', () => chrome.storage.local.set({ prefHalo: checkHalo.checked }));
  checkClickRipple.addEventListener('change', () => chrome.storage.local.set({ prefClickRipple: checkClickRipple.checked }));
  if (checkFloatingDock) {
    checkFloatingDock.addEventListener('change', () => chrome.storage.local.set({ prefFloatingDock: checkFloatingDock.checked }));
  }

  // Interactive Sandbox Demo
  const themeColors = {
    yellow: { ring: '#f59e0b', bloom: 'rgba(245, 158, 11, 0.4)' },
    cyan:   { ring: '#06b6d4', bloom: 'rgba(6, 182, 212, 0.4)' },
    violet: { ring: '#a855f7', bloom: 'rgba(168, 85, 247, 0.4)' },
    red:    { ring: '#ef4444', bloom: 'rgba(239, 68, 68, 0.4)' },
    green:  { ring: '#22c55e', bloom: 'rgba(34, 197, 94, 0.4)' }
  };

  testClickArea.addEventListener('pointerdown', (e) => {
    const rect = testClickArea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const color = themeColors[selectedTheme] || themeColors.yellow;

    // Outer shockwave
    const shock = document.createElement('div');
    shock.style.position = 'absolute';
    shock.style.left = `${x}px`;
    shock.style.top = `${y}px`;
    shock.style.width = '10px';
    shock.style.height = '10px';
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

  function showError(msg) {
    errorMessage.textContent = msg;
    errorBanner.classList.remove('hidden');
  }

  btnDismissError.addEventListener('click', () => {
    errorBanner.classList.add('hidden');
  });

  // History / Library Launcher
  btnHistory.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('preview/preview.html') });
  });

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

    recordingMeta.innerHTML = `
      <span class="spec-pill">${width}</span>
      <span class="spec-pill">${fps} FPS</span>
      <span class="spec-pill accent">${bitrate}</span>
    `;

    updatePauseResumeButton(state.isPaused);
    startTimer(state.startTime || Date.now());
  }

  function updatePauseResumeButton(isPaused) {
    if (isPaused) {
      pauseResumeIcon.textContent = '▶';
      pauseResumeText.textContent = 'Resume';
    } else {
      pauseResumeIcon.textContent = '⏸';
      pauseResumeText.textContent = 'Pause';
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

    let resolution = '1080p';
    let fps = 60;
    if (selectedQuality === '1080p30') fps = 30;
    else if (selectedQuality === '720p60') { resolution = '720p'; fps = 60; }

    const options = {
      resolution,
      fps,
      includeTabAudio: checkTabAudio.checked,
      includeMic: checkMic.checked,
      enableHalo: checkHalo.checked,
      enableClickRipple: checkClickRipple.checked,
      showFloatingDock: checkFloatingDock ? checkFloatingDock.checked : true,
      cursorTheme: selectedTheme
    };

    chrome.runtime.sendMessage({
      action: 'START_RECORDING_REQUEST',
      options
    }, (response) => {
      btnStart.disabled = false;
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
    chrome.runtime.sendMessage({ action: 'STOP_RECORDING_REQUEST' }, () => {
      btnStop.disabled = false;
      showConfigView();
      window.close();
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
