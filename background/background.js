/**
 * Background Service Worker for Tab Recording Extension (Manifest V3)
 */

const OFFSCREEN_DOCUMENT_PATH = 'offscreen/offscreen.html';

let currentRecordingState = {
  isRecording: false,
  isPaused: false,
  tabId: null,
  startTime: null,
  options: {}
};

// Check if offscreen document exists
async function hasOffscreenDocument() {
  if ('getContexts' in chrome.runtime) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
    });
    return Boolean(contexts.length);
  }
  // Fallback for older Chrome versions
  const matchedClients = await clients.matchAll();
  return matchedClients.some((c) => c.url.includes(chrome.runtime.id) && c.url.includes('offscreen.html'));
}

// Setup or ensure offscreen document exists
async function ensureOffscreenDocument() {
  if (await hasOffscreenDocument()) return;

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ['USER_MEDIA', 'DISPLAY_MEDIA'],
    justification: 'Record high quality 1080p tab stream with audio'
  });
}

// Safely close offscreen document
async function closeOffscreenDocument() {
  if (await hasOffscreenDocument()) {
    await chrome.offscreen.closeDocument();
  }
}

// Update Extension Action Badge
function updateBadge(state) {
  if (state === 'RECORDING') {
    chrome.action.setBadgeText({ text: 'REC' });
    chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
  } else if (state === 'PAUSED') {
    chrome.action.setBadgeText({ text: 'PAUSE' });
    chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Start Recording Workflow
async function handleStartRecording(options) {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab || !activeTab.id) {
    throw new Error('No active tab found to record.');
  }

  // Prevent recording Chrome internal URLs (restrictions in browser engine)
  if (activeTab.url && (activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('chrome-extension://') || activeTab.url.startsWith('edge://'))) {
    throw new Error('Chrome does not allow recording internal chrome:// pages. Please switch to a regular website (e.g. google.com, youtube.com, etc.).');
  }

  // 1. Get tab media stream ID
  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: activeTab.id
  });

  // 2. Ensure Offscreen document is loaded
  await ensureOffscreenDocument();

  // 3. Inject and activate cursor effects in the active tab
  try {
    await chrome.tabs.sendMessage(activeTab.id, {
      action: 'START_CURSOR_EFFECTS',
      options: {
        enableHalo: options.enableHalo ?? true,
        enableClickRipple: options.enableClickRipple ?? true,
        theme: options.cursorTheme || 'yellow'
      }
    });
  } catch (err) {
    // If content script was not ready or page just loaded, inject it
    try {
      await chrome.scripting.insertCSS({
        target: { tabId: activeTab.id },
        files: ['content/content.css']
      });
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['content/content.js']
      });
      await chrome.tabs.sendMessage(activeTab.id, {
        action: 'START_CURSOR_EFFECTS',
        options: {
          enableHalo: options.enableHalo ?? true,
          enableClickRipple: options.enableClickRipple ?? true,
          theme: options.cursorTheme || 'yellow'
        }
      });
    } catch (scriptErr) {
      console.warn('Could not inject cursor highlighter script:', scriptErr);
    }
  }

  // 4. Send start message to offscreen document
  const response = await chrome.runtime.sendMessage({
    target: 'offscreen',
    action: 'START_RECORDING',
    streamId,
    resolution: options.resolution || '1080p',
    fps: options.fps || 60,
    includeTabAudio: options.includeTabAudio ?? true,
    includeMic: options.includeMic ?? false
  });

  if (response && response.success === false) {
    throw new Error(response.error || 'Offscreen recorder failed to start.');
  }

  // 5. Update state
  currentRecordingState = {
    isRecording: true,
    isPaused: false,
    tabId: activeTab.id,
    startTime: Date.now(),
    options
  };

  await chrome.storage.local.set({
    isRecording: true,
    isPaused: false,
    recordingTabId: activeTab.id,
    recordingStartTime: currentRecordingState.startTime,
    cursorSettings: {
      enableHalo: options.enableHalo ?? true,
      enableClickRipple: options.enableClickRipple ?? true,
      theme: options.cursorTheme || 'yellow'
    }
  });

  updateBadge('RECORDING');
  return { success: true };
}

// Stop Recording Workflow
async function handleStopRecording() {
  if (!currentRecordingState.isRecording) return { success: false, error: 'Not recording' };

  // Remove cursor effects from recorded tab
  if (currentRecordingState.tabId) {
    try {
      await chrome.tabs.sendMessage(currentRecordingState.tabId, {
        action: 'STOP_CURSOR_EFFECTS'
      });
    } catch (e) {
      // Tab may have been closed
    }
  }

  // Request offscreen document to stop recording
  chrome.runtime.sendMessage({
    target: 'offscreen',
    action: 'STOP_RECORDING'
  });

  currentRecordingState.isRecording = false;
  currentRecordingState.isPaused = false;
  updateBadge('OFF');

  await chrome.storage.local.set({
    isRecording: false,
    isPaused: false,
    recordingTabId: null
  });

  return { success: true };
}

// Pause Recording Workflow
async function handlePauseRecording() {
  chrome.runtime.sendMessage({
    target: 'offscreen',
    action: 'PAUSE_RECORDING'
  });
  currentRecordingState.isPaused = true;
  await chrome.storage.local.set({ isPaused: true });
  updateBadge('PAUSED');
  return { success: true };
}

// Resume Recording Workflow
async function handleResumeRecording() {
  chrome.runtime.sendMessage({
    target: 'offscreen',
    action: 'RESUME_RECORDING'
  });
  currentRecordingState.isPaused = false;
  await chrome.storage.local.set({ isPaused: false });
  updateBadge('RECORDING');
  return { success: true };
}

// Listen for messages from popup, offscreen, and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'START_RECORDING_REQUEST') {
    handleStartRecording(message.options)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'STOP_RECORDING_REQUEST') {
    handleStopRecording()
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'PAUSE_RECORDING_REQUEST') {
    handlePauseRecording().then((res) => sendResponse(res));
    return true;
  }

  if (message.action === 'RESUME_RECORDING_REQUEST') {
    handleResumeRecording().then((res) => sendResponse(res));
    return true;
  }

  if (message.action === 'GET_STATUS_REQUEST') {
    sendResponse({
      ...currentRecordingState,
      duration: currentRecordingState.isRecording && currentRecordingState.startTime
        ? Date.now() - currentRecordingState.startTime
        : 0
    });
    return false;
  }

  if (message.action === 'CHECK_RECORDING_TAB') {
    const isCurrentTab = sender.tab && currentRecordingState.isRecording && sender.tab.id === currentRecordingState.tabId;
    sendResponse({ isCurrentTab });
    return false;
  }

  // Sent from offscreen document when video Blob is saved in DB
  if (message.action === 'RECORDING_FINISHED_SUCCESS') {
    console.log('Recording finished successfully! Opening preview...', message);
    const previewUrl = chrome.runtime.getURL(`preview/preview.html?id=${encodeURIComponent(message.recordingId)}`);
    chrome.tabs.create({ url: previewUrl });
    closeOffscreenDocument();
    return false;
  }

  if (message.action === 'RECORDING_FAILED') {
    console.error('Recording failed:', message.error);
    handleStopRecording();
    closeOffscreenDocument();
    return false;
  }
});

// If the recorded tab is closed by the user, automatically stop and save
chrome.tabs.onRemoved.addListener((tabId) => {
  if (currentRecordingState.isRecording && currentRecordingState.tabId === tabId) {
    console.log('Recorded tab was closed, stopping recording.');
    handleStopRecording();
  }
});
