/**
 * Popup Controller for Tab Recorder HD
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

  const pillButtons = document.querySelectorAll('.pill-option');
  const checkTabAudio = document.getElementById('checkTabAudio');
  const checkMic = document.getElementById('checkMic');
  const checkHalo = document.getElementById('checkHalo');
  const checkClickRipple = document.getElementById('checkClickRipple');
  const themeBubbles = document.querySelectorAll('.theme-bubble');
  const testClickArea = document.getElementById('testClickArea');

  // State
  let timerInterval = null;
  let selectedQuality = '1080p60';
  let selectedTheme = 'yellow';

  // Load saved preferences
  const saved = await chrome.storage.local.get([
    'prefQuality',
    'prefTabAudio',
    'prefMic',
    'prefHalo',
    'prefClickRipple',
    'prefTheme'
  ]);

  if (saved.prefQuality) {
    selectedQuality = saved.prefQuality;
    pillButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.quality === selectedQuality);
    });
  }
  if (saved.prefTabAudio !== undefined) checkTabAudio.checked = saved.prefTabAudio;
  if (saved.prefMic !== undefined) checkMic.checked = saved.prefMic;
  if (saved.prefHalo !== undefined) checkHalo.checked = saved.prefHalo;
  if (saved.prefClickRipple !== undefined) checkClickRipple.checked = saved.prefClickRipple;
  if (saved.prefTheme) {
    selectedTheme = saved.prefTheme;
    themeBubbles.forEach(b => {
      b.classList.toggle('active', b.dataset.theme === selectedTheme);
    });
  }

  // Quality selector clicks
  pillButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      pillButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedQuality = btn.dataset.quality;
      chrome.storage.local.set({ prefQuality: selectedQuality });
      updateStartButtonLabel();
    });
  });

  // Theme selection
  themeBubbles.forEach(btn => {
    btn.addEventListener('click', () => {
      themeBubbles.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTheme = btn.dataset.theme;
      chrome.storage.local.set({ prefTheme: selectedTheme });
    });
  });

  // Settings change persist
  checkTabAudio.addEventListener('change', () => chrome.storage.local.set({ prefTabAudio: checkTabAudio.checked }));
  checkMic.addEventListener('change', () => chrome.storage.local.set({ prefMic: checkMic.checked }));
  checkHalo.addEventListener('change', () => chrome.storage.local.set({ prefHalo: checkHalo.checked }));
  checkClickRipple.addEventListener('change', () => chrome.storage.local.set({ prefClickRipple: checkClickRipple.checked }));

  // Interactive Test Box Demo
  testClickArea.addEventListener('pointerdown', (e) => {
    const rect = testClickArea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = '12px';
    ripple.style.height = '12px';
    ripple.style.borderRadius = '50%';
    ripple.style.pointerEvents = 'none';
    ripple.style.transform = 'translate(-50%, -50%)';

    const colors = {
      yellow: 'rgba(245, 158, 11, 0.7)',
      cyan: 'rgba(6, 182, 212, 0.7)',
      red: 'rgba(239, 68, 68, 0.7)',
      green: 'rgba(34, 197, 94, 0.7)'
    };
    ripple.style.background = colors[selectedTheme] || colors.yellow;
    ripple.style.boxShadow = `0 0 12px ${colors[selectedTheme] || colors.yellow}`;
    ripple.style.transition = 'all 0.4s ease-out';

    testClickArea.appendChild(ripple);

    requestAnimationFrame(() => {
      ripple.style.transform = 'translate(-50%, -50%) scale(4.5)';
      ripple.style.opacity = '0';
    });

    setTimeout(() => ripple.remove(), 400);
  });

  function updateStartButtonLabel() {
    const is1080 = selectedQuality.startsWith('1080');
    btnStart.querySelector('span:last-child').textContent = is1080
      ? 'Start 1080p Recording'
      : 'Start 720p Recording';
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorBanner.classList.remove('hidden');
  }

  btnDismissError.addEventListener('click', () => {
    errorBanner.classList.add('hidden');
  });

  // History button
  btnHistory.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('preview/preview.html') });
  });

  // Check current recording status
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
    recordingMeta.textContent = `${res} @ ${fps} FPS`;

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

      const fmt = [
        hrs.toString().padStart(2, '0'),
        mins.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0')
      ].join(':');

      recordingTimer.textContent = fmt;
    }

    tick();
    timerInterval = setInterval(tick, 1000);
  }

  // Handle Start Recording
  btnStart.addEventListener('click', async () => {
    btnStart.disabled = true;
    errorBanner.classList.add('hidden');

    let resolution = '1080p';
    let fps = 60;
    if (selectedQuality === '1080p30') {
      fps = 30;
    } else if (selectedQuality === '720p60') {
      resolution = '720p';
      fps = 60;
    }

    const options = {
      resolution,
      fps,
      includeTabAudio: checkTabAudio.checked,
      includeMic: checkMic.checked,
      enableHalo: checkHalo.checked,
      enableClickRipple: checkClickRipple.checked,
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

  // Handle Stop Recording
  btnStop.addEventListener('click', () => {
    btnStop.disabled = true;
    chrome.runtime.sendMessage({ action: 'STOP_RECORDING_REQUEST' }, (response) => {
      btnStop.disabled = false;
      showConfigView();
      // Close popup automatically as preview tab will be opened
      window.close();
    });
  });

  // Handle Pause / Resume
  btnPauseResume.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'GET_STATUS_REQUEST' }, (state) => {
      if (!state || !state.isRecording) return;

      if (state.isPaused) {
        chrome.runtime.sendMessage({ action: 'RESUME_RECORDING_REQUEST' }, () => {
          updatePauseResumeButton(false);
        });
      } else {
        chrome.runtime.sendMessage({ action: 'PAUSE_RECORDING_REQUEST' }, () => {
          updatePauseResumeButton(true);
        });
      }
    });
  });
});
