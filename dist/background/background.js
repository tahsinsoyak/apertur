/**
 * Background Service Worker for Apertur Screen Recorder (Manifest V3)
 */

try {
  importScripts('/utils/db.js');
} catch (e) {
  try {
    importScripts('../utils/db.js');
  } catch (e2) {
    console.warn('Could not import db.js in background service worker:', e, e2);
  }
}

const OFFSCREEN_DOCUMENT_PATH = 'offscreen/offscreen.html';

let currentRecordingState = {
  isRecording: false,
  isPaused: false,
  tabId: null,
  startTime: null,
  captureMode: 'continuous',
  options: {}
};

// Restore state from storage on Service Worker startup / wake up
chrome.storage.local.get([
  'isRecording',
  'isPaused',
  'captureMode',
  'recordingTabId',
  'recordingStartTime',
  'recordingOptions',
  'cursorSettings'
], (res) => {
  if (res && res.isRecording) {
    currentRecordingState.isRecording = true;
    currentRecordingState.isPaused = Boolean(res.isPaused);
    currentRecordingState.captureMode = res.captureMode || 'continuous';
    currentRecordingState.tabId = res.recordingTabId || null;
    currentRecordingState.startTime = res.recordingStartTime || Date.now();
    currentRecordingState.options = res.recordingOptions || {};
    updateBadge(currentRecordingState.isPaused ? 'PAUSED' : 'RECORDING');
  }
});

// Check if offscreen document exists
async function hasOffscreenDocument() {
  if ('getContexts' in chrome.runtime) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
    });
    return Boolean(contexts.length);
  }
  try {
    const matchedClients = typeof clients !== 'undefined' ? await clients.matchAll() : [];
    return matchedClients.some((c) => c.url.includes(chrome.runtime.id) && c.url.includes('offscreen.html'));
  } catch (e) {
    return false;
  }
}

// Setup or ensure offscreen document exists
async function ensureOffscreenDocument() {
  if (await hasOffscreenDocument()) return;

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ['USER_MEDIA', 'DISPLAY_MEDIA'],
    justification: 'Record 1080p 60 FPS video and audio streams'
  });
}

// Safely close offscreen document
async function closeOffscreenDocument() {
  try {
    if (await hasOffscreenDocument()) {
      await chrome.offscreen.closeDocument();
    }
  } catch (e) {
    console.warn('Error closing offscreen document:', e);
  }
}

// Update Extension Action Badge
function updateBadge(state) {
  if (state === 'RECORDING') {
    chrome.action.setBadgeText({ text: 'REC' });
    chrome.action.setBadgeBackgroundColor({ color: '#E11D48' });
  } else if (state === 'PAUSED') {
    chrome.action.setBadgeText({ text: 'PAUSE' });
    chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Helper to inject and activate cursor effects & floating HUD on a tab
async function attachCursorEffectsToTab(tabId, cursorPayload) {
  if (!tabId) return;
  try {
    await chrome.tabs.sendMessage(tabId, {
      action: 'START_CURSOR_EFFECTS',
      options: cursorPayload,
      startTime: cursorPayload.startTime,
      isPaused: Boolean(cursorPayload.isPaused)
    });
  } catch (err) {
    try {
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ['content/content.css']
      });
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content/content.js']
      });
      await chrome.tabs.sendMessage(tabId, {
        action: 'START_CURSOR_EFFECTS',
        options: cursorPayload,
        startTime: cursorPayload.startTime,
        isPaused: Boolean(cursorPayload.isPaused)
      });
    } catch (scriptErr) {
      // Tab is a protected chrome:// or extension page where content scripts cannot run
    }
  }
}

// Start Recording Workflow
async function handleStartRecording(options = {}) {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const captureMode = options.captureMode || 'continuous';

  // Only restrict chrome:// URLs when using single-tab capture (tabCapture API limitation)
  if (captureMode === 'tab') {
    if (!activeTab || !activeTab.id) {
      throw new Error('No active tab found to record.');
    }
    if (
      activeTab.url &&
      (activeTab.url.startsWith('chrome://') ||
        activeTab.url.startsWith('chrome-extension://') ||
        activeTab.url.startsWith('edge://'))
    ) {
      throw new Error(
        'This Tab Only mode cannot record internal Chrome pages. Switch to a regular website or choose "Browser Window" mode above.'
      );
    }
  }

  // 1. Ensure fresh Offscreen document is loaded and ready
  await ensureOffscreenDocument();

  let streamId = null;
  let mediaSource = 'desktop';
  let canRequestAudio = Boolean(options.includeTabAudio);

  if (captureMode === 'tab') {
    mediaSource = 'tab';
    try {
      streamId = await new Promise((resolve, reject) => {
        chrome.tabCapture.getMediaStreamId({ targetTabId: activeTab.id }, (id) => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }
          resolve(id);
        });
      });
    } catch (streamErr) {
      const msg = streamErr.message || '';
      if (msg.includes('Cannot capture a tab with an active stream') || msg.includes('active stream')) {
        await closeOffscreenDocument();
        currentRecordingState.isRecording = false;
        updateBadge('OFF');
        await chrome.storage.local.set({ isRecording: false, recordingTabId: null });
        throw new Error('ACTIVE_STREAM_LOCKED: This tab has an active stream lock from Chrome.');
      }
      throw streamErr;
    }
  } else {
    // For Browser Window ('continuous') and Entire Screen ('screen'):
    // Offscreen document uses navigator.mediaDevices.getDisplayMedia directly (no streamId origin mismatch!)
    streamId = null;
    mediaSource = 'desktop';
  }

  // 2. Ask offscreen document to acquire stream and start MediaRecorder
  const response = await chrome.runtime.sendMessage({
    target: 'offscreen',
    action: 'START_RECORDING',
    streamId,
    mediaSource,
    captureMode,
    canRequestAudio,
    resolution: options.resolution || '1080p',
    fps: options.fps || 60,
    includeTabAudio: Boolean(options.includeTabAudio),
    includeMic: Boolean(options.includeMic),
    micDeviceId: options.micDeviceId || null,
    micGain: options.micGain || 1.0,
    noiseSuppression: options.noiseSuppression ?? true,
    enableCountdown: Boolean(options.enableCountdown)
  });

  if (!response || response.success === false) {
    await closeOffscreenDocument();
    const errMsg = response?.error || 'Recording was cancelled or failed to start.';
    throw new Error(errMsg);
  }

  // 3. Re-query active tab (in case user switched window/tab during picker) and attach HUD + Cursor FX
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const targetTabId = (currentTab && currentTab.id) || (activeTab && activeTab.id) || null;
  const startTime = Date.now();

  const cursorPayload = {
    enableHalo: options.enableHalo ?? true,
    enableClickRipple: options.enableClickRipple ?? true,
    showFloatingDock: options.showFloatingDock ?? true,
    cursorTheme: options.cursorTheme || 'yellow',
    theme: options.cursorTheme || 'yellow',
    startTime,
    isPaused: false
  };

  // 4. Persist state before attaching HUD so content script status checks see isRecording = true
  currentRecordingState = {
    isRecording: true,
    isPaused: false,
    tabId: targetTabId,
    startTime,
    captureMode,
    options
  };

  await chrome.storage.local.set({
    isRecording: true,
    isPaused: false,
    captureMode,
    recordingTabId: targetTabId,
    recordingStartTime: startTime,
    recordingOptions: options,
    cursorSettings: cursorPayload
  });

  updateBadge('RECORDING');

  if (targetTabId) {
    await attachCursorEffectsToTab(targetTabId, cursorPayload);
  }

  return { success: true };
}

// Stop Recording Workflow
async function handleStopRecording() {
  console.log('handleStopRecording: stopping recording session...');

  const stored = await chrome.storage.local.get(['isRecording', 'recordingTabId']);
  const offscreenExists = await hasOffscreenDocument();
  const isCurrentlyRecording = Boolean(stored.isRecording || currentRecordingState.isRecording || offscreenExists);

  if (!isCurrentlyRecording) {
    updateBadge('OFF');
    return { success: false, error: 'Not recording' };
  }

  // 1. Stop cursor effects & floating HUD on all tabs immediately
  try {
    const allTabs = await chrome.tabs.query({});
    for (const tab of allTabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'STOP_CURSOR_EFFECTS' }).catch(() => {});
      }
    }
  } catch (e) {}

  // 2. Command offscreen document to stop recording and wait for IndexedDB save to complete
  if (offscreenExists) {
    try {
      await chrome.runtime.sendMessage({
        target: 'offscreen',
        action: 'STOP_RECORDING'
      });
    } catch (err) {
      console.warn('Could not send STOP_RECORDING to offscreen:', err);
    }
  }

  // 3. Reset state
  currentRecordingState.isRecording = false;
  currentRecordingState.isPaused = false;
  currentRecordingState.tabId = null;
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
  const offscreenExists = await hasOffscreenDocument();
  if (offscreenExists) {
    chrome.runtime.sendMessage({
      target: 'offscreen',
      action: 'PAUSE_RECORDING'
    }).catch(() => {});
  }
  currentRecordingState.isPaused = true;
  await chrome.storage.local.set({ isPaused: true });
  updateBadge('PAUSED');
  return { success: true };
}

// Resume Recording Workflow
async function handleResumeRecording() {
  const offscreenExists = await hasOffscreenDocument();
  if (offscreenExists) {
    chrome.runtime.sendMessage({
      target: 'offscreen',
      action: 'RESUME_RECORDING'
    }).catch(() => {});
  }
  currentRecordingState.isPaused = false;
  await chrome.storage.local.set({ isPaused: false });
  updateBadge('RECORDING');
  return { success: true };
}

// Listen for messages from popup, offscreen, and content scripts
let lastOpenedRecordingId = null;

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
    chrome.storage.local.get([
      'isRecording',
      'isPaused',
      'captureMode',
      'recordingTabId',
      'recordingStartTime',
      'recordingOptions'
    ], (stored) => {
      const isRecording = Boolean(stored.isRecording || currentRecordingState.isRecording);
      const isPaused = Boolean(stored.isPaused || currentRecordingState.isPaused);
      const startTime = stored.recordingStartTime || currentRecordingState.startTime || Date.now();
      const options = stored.recordingOptions || currentRecordingState.options || {};
      const captureMode = stored.captureMode || currentRecordingState.captureMode || 'continuous';

      sendResponse({
        isRecording,
        isPaused,
        captureMode,
        startTime,
        options,
        duration: isRecording ? Date.now() - startTime : 0
      });
    });
    return true;
  }

  if (message.action === 'RESET_TAB_LOCK_REQUEST') {
    (async () => {
      await closeOffscreenDocument();
      currentRecordingState.isRecording = false;
      currentRecordingState.tabId = null;
      updateBadge('OFF');
      await chrome.storage.local.set({ isRecording: false, recordingTabId: null });

      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.id) {
        chrome.tabs.reload(activeTab.id, () => {
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: true });
      }
    })();
    return true;
  }

  // Sent from offscreen document after video Blob is committed to IndexedDB
  if (message.action === 'RECORDING_FINISHED_SUCCESS') {
    (async () => {
      if (lastOpenedRecordingId === message.recordingId) {
        sendResponse({ ok: true });
        return;
      }
      lastOpenedRecordingId = message.recordingId;

      currentRecordingState.isRecording = false;
      currentRecordingState.isPaused = false;
      currentRecordingState.tabId = null;
      updateBadge('OFF');

      await chrome.storage.local.set({
        isRecording: false,
        isPaused: false,
        recordingTabId: null
      });

      // Stop cursor effects on all tabs
      try {
        const allTabs = await chrome.tabs.query({});
        for (const tab of allTabs) {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { action: 'STOP_CURSOR_EFFECTS' }).catch(() => {});
          }
        }
      } catch (e) {}

      const previewUrl = chrome.runtime.getURL(`preview/preview.html?id=${encodeURIComponent(message.recordingId)}`);
      await chrome.tabs.create({ url: previewUrl });

      setTimeout(() => {
        closeOffscreenDocument();
      }, 400);

      sendResponse({ ok: true });
    })();
    return true;
  }

  if (message.action === 'RUN_TAB_COUNTDOWN') {
    (async () => {
      const seconds = Number(message.seconds) || 3;
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (activeTab && activeTab.id) {
        try {
          await chrome.tabs.sendMessage(activeTab.id, {
            action: 'SHOW_COUNTDOWN_OVERLAY',
            seconds
          });
        } catch (err) {
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
              action: 'SHOW_COUNTDOWN_OVERLAY',
              seconds
            });
          } catch (_) {}
        }
      }

      for (let remaining = seconds; remaining >= 1; remaining--) {
        chrome.action.setBadgeText({ text: String(remaining) });
        chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' });
        await new Promise((r) => setTimeout(r, 950));
      }

      // Give 120ms for countdown overlay fade-out before MediaRecorder starts capturing frames
      await new Promise((r) => setTimeout(r, 120));
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (message.action === 'CAPTURE_TAB_SCREENSHOT_REQUEST') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        sendResponse({
          success: false,
          error: chrome.runtime.lastError?.message || 'Could not capture tab screenshot.'
        });
        return;
      }
      sendResponse({ success: true, dataUrl });
    });
    return true;
  }

  if (message.action === 'SAVE_SCREENSHOT_TO_LIBRARY_REQUEST') {
    (async () => {
      try {
        const item = message.screenshot;
        if (!item) {
          sendResponse({ success: false, error: 'No screenshot data provided.' });
          return;
        }
        if (self.RecorderDB && self.RecorderDB.saveScreenshot) {
          await self.RecorderDB.saveScreenshot(item);
          sendResponse({ success: true, id: item.id });
        } else {
          sendResponse({ success: false, error: 'RecorderDB unavailable in background.' });
        }
      } catch (err) {
        console.error('Error saving screenshot in background:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'TRIGGER_AREA_SNIP_FROM_POPUP') {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (!tab || !tab.id) return;
      try {
        await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['content/content.css'] });
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/content.js'] });
      } catch (_) {}
      chrome.tabs.sendMessage(tab.id, { action: 'START_AREA_SELECTION', options: message.options }, () => {
        const _ = chrome.runtime.lastError;
      });
    })();
    sendResponse({ ok: true });
    return false;
  }

  if (message.action === 'TRIGGER_FULL_PAGE_FROM_POPUP') {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (!tab || !tab.id) return;
      try {
        await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['content/content.css'] });
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/content.js'] });
      } catch (_) {}
      chrome.tabs.sendMessage(tab.id, { action: 'START_FULL_PAGE_SCREENSHOT', options: message.options }, () => {
        const _ = chrome.runtime.lastError;
      });
    })();
    sendResponse({ ok: true });
    return false;
  }

  if (message.action === 'RECORDING_FAILED') {
    console.error('Recording failed:', message.error);
    handleStopRecording();
    setTimeout(() => closeOffscreenDocument(), 300);
    sendResponse({ ok: true });
    return false;
  }
});

// Re-inject and re-attach floating dock & cursor when recorded tab navigates, redirects, or reloads
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    const data = await chrome.storage.local.get([
      'isRecording',
      'isPaused',
      'captureMode',
      'recordingTabId',
      'recordingStartTime',
      'cursorSettings'
    ]);

    if (!data || !data.isRecording) return;

    const shouldAttach =
      data.recordingTabId === tabId ||
      ((data.captureMode === 'continuous' || data.captureMode === 'screen') && tab.active);

    if (shouldAttach) {
      const cursorPayload = {
        ...(data.cursorSettings || {}),
        startTime: data.recordingStartTime,
        isPaused: Boolean(data.isPaused)
      };
      await attachCursorEffectsToTab(tabId, cursorPayload);
    }
  }
});

// When user switches tabs in Window/Screen mode, attach dock to the newly active tab
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const data = await chrome.storage.local.get([
    'isRecording',
    'isPaused',
    'captureMode',
    'recordingStartTime',
    'cursorSettings'
  ]);

  if (!data || !data.isRecording) return;
  if (data.captureMode === 'continuous' || data.captureMode === 'screen') {
    const cursorPayload = {
      ...(data.cursorSettings || {}),
      startTime: data.recordingStartTime,
      isPaused: Boolean(data.isPaused)
    };
    await attachCursorEffectsToTab(activeInfo.tabId, cursorPayload);
  }
});

// If the recorded tab is closed in Single-Tab mode, automatically stop and save
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const data = await chrome.storage.local.get(['isRecording', 'captureMode', 'recordingTabId']);
  if (data && data.isRecording && data.captureMode === 'tab' && data.recordingTabId === tabId) {
    handleStopRecording();
  }
});

// Global Keyboard Shortcuts (Alt+Shift+V for Visible, Alt+Shift+A for Snip, Alt+Shift+F for Full Page)
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || !tab.id || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return;
  }

  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['content/content.css']
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content/content.js']
    });
  } catch (_) {}

  if (command === 'capture_visible') {
    chrome.tabs.sendMessage(tab.id, { action: 'TRIGGER_VISIBLE_SCREENSHOT' }, () => {
      const _ = chrome.runtime.lastError;
    });
  } else if (command === 'capture_selected') {
    chrome.tabs.sendMessage(tab.id, { action: 'START_AREA_SELECTION' }, () => {
      const _ = chrome.runtime.lastError;
    });
  } else if (command === 'capture_full') {
    chrome.tabs.sendMessage(tab.id, { action: 'START_FULL_PAGE_SCREENSHOT' }, () => {
      const _ = chrome.runtime.lastError;
    });
  }
});
