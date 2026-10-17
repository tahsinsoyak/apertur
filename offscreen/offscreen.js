/**
 * Offscreen Document Script for 1080p Video & Audio Recording
 */

let mediaRecorder = null;
let recordedChunks = [];
let combinedStream = null;
let rawTabStream = null;
let micStream = null;
let audioContext = null;
let recordingStartTime = 0;
let recordingOptions = {};
let isSavingRecording = false;
let pendingStopResolvers = [];

// Select best supported mimeType for high quality
function getSupportedMimeType() {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm'
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'video/webm';
}

/**
 * Acquires the video/audio stream for Tab, Window, or Screen mode
 */
async function acquireCaptureStream({
  streamId,
  mediaSource,
  captureMode,
  width,
  height,
  fps,
  includeTabAudio
}) {
  // 1. If we have a streamId from tabCapture or desktopCapture
  if (streamId) {
    const videoMandatory = {
      chromeMediaSource: mediaSource,
      chromeMediaSourceId: streamId,
      maxWidth: width,
      maxHeight: height,
      maxFrameRate: fps
    };

    if (includeTabAudio) {
      try {
        return await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: mediaSource,
              chromeMediaSourceId: streamId
            }
          },
          video: { mandatory: videoMandatory }
        });
      } catch (audioErr) {
        console.warn('Audio track not available on this source, retrying video-only:', audioErr);
      }
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { mandatory: videoMandatory }
      });
    } catch (videoErr) {
      console.warn('getUserMedia with streamId failed, falling back to getDisplayMedia:', videoErr);
    }
  }

  // 2. Direct getDisplayMedia (Manifest V3 DISPLAY_MEDIA offscreen reason)
  const displaySurface = captureMode === 'screen' ? 'monitor' : 'window';
  try {
    return await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface,
        width: { ideal: width },
        height: { ideal: height },
        frameRate: { ideal: fps }
      },
      audio: Boolean(includeTabAudio)
    });
  } catch (displayErr) {
    if (displayErr && displayErr.name === 'NotAllowedError') {
      throw displayErr;
    }
    console.warn('Primary getDisplayMedia constraints failed, retrying with basic video constraints:', displayErr?.message || displayErr);
    return await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false
    });
  }
}

/**
 * Starts recording at 1080p / 720p
 */
async function startRecording(message) {
  try {
    // Clean up any leftover state from a previous session
    cleanupAllResources();
    isSavingRecording = false;
    recordedChunks = [];
    pendingStopResolvers = [];

    const {
      streamId = null,
      mediaSource = 'desktop',
      captureMode = 'continuous',
      resolution = '1080p',
      fps = 60,
      includeTabAudio = true,
      includeMic = false,
      enableCountdown = false
    } = message;

    recordingOptions = { resolution, fps, includeTabAudio, includeMic, mediaSource, captureMode };

    let width = 1920;
    let height = 1080;
    if (resolution === '720p') {
      width = 1280;
      height = 720;
    }

    const videoBitrate = (resolution === '1080p' && fps >= 60) ? 12000000 : 8000000;

    // 1. Capture the media stream
    rawTabStream = await acquireCaptureStream({
      streamId,
      mediaSource,
      captureMode,
      width,
      height,
      fps,
      includeTabAudio
    });

    audioContext = new AudioContext();
    if (audioContext.state === 'suspended') {
      await audioContext.resume().catch(() => {});
    }
    const audioDestination = audioContext.createMediaStreamDestination();
    let hasAnyAudioSource = false;

    // 2. System / Tab Audio routing
    const tabAudioTracks = rawTabStream.getAudioTracks();
    if (includeTabAudio && tabAudioTracks.length > 0) {
      const tabAudioSource = audioContext.createMediaStreamSource(new MediaStream(tabAudioTracks));
      // Connect to speakers ONLY for tabCapture (tabCapture mutes the tab by default)
      if (mediaSource === 'tab') {
        tabAudioSource.connect(audioContext.destination);
      }
      tabAudioSource.connect(audioDestination);
      hasAnyAudioSource = true;
    }

    // 3. Optional Microphone mixing
    if (includeMic) {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (micStream.getAudioTracks().length > 0) {
          const micSource = audioContext.createMediaStreamSource(micStream);
          micSource.connect(audioDestination);
          hasAnyAudioSource = true;
        }
      } catch (err) {
        console.warn('Microphone capture unavailable, continuing without mic:', err);
      }
    }

    // 4. Combine video tracks with mixed audio (only attach audio track if a real audio source exists)
    const outputTracks = [...rawTabStream.getVideoTracks()];
    if (hasAnyAudioSource) {
      const mixedAudioTracks = audioDestination.stream.getAudioTracks();
      if (mixedAudioTracks.length > 0) {
        outputTracks.push(mixedAudioTracks[0]);
      }
    }

    combinedStream = new MediaStream(outputTracks);

    // Watch for stream termination (e.g. user clicks "Stop Sharing" on Chrome's native bar)
    const videoTracks = rawTabStream.getVideoTracks();
    if (videoTracks.length > 0) {
      videoTracks[0].onended = () => {
        console.log('Video stream track ended by user/browser. Auto-saving recording...');
        stopRecording();
      };
    }

    // 5. Optional 3-Second Countdown on page right after user selects window/tab
    if (enableCountdown) {
      try {
        await chrome.runtime.sendMessage({
          action: 'RUN_TAB_COUNTDOWN',
          seconds: 3
        });
      } catch (_) {}
    }

    // Verify stream wasn't cancelled by user during the 3-second countdown
    if (!rawTabStream || videoTracks.length === 0 || videoTracks[0].readyState === 'ended') {
      cleanupAllResources();
      return { success: false, error: 'Screen or window selection was cancelled.' };
    }

    // 6. Initialize MediaRecorder
    const mimeType = getSupportedMimeType();

    mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: videoBitrate
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      await finalizeAndSaveRecording(mimeType);
    };

    // Collect chunks every 250ms so even short recordings have complete data
    mediaRecorder.start(250);
    recordingStartTime = Date.now();

    chrome.runtime.sendMessage({
      action: 'RECORDING_STARTED_CONFIRMED',
      resolution: `${width}x${height}`,
      fps
    }).catch(() => {});

    return { success: true };
  } catch (error) {
    const errName = error?.name || 'Error';
    const errMsg = error?.message || 'Failed to capture media stream.';
    console.warn(`Recording start stopped (${errName}): ${errMsg}`);
    cleanupAllResources();
    const friendlyError = errName === 'NotAllowedError'
      ? 'Screen or window selection was cancelled.'
      : errMsg;
    return { success: false, error: friendlyError };
  }
}

function resolveAllPendingStops(result) {
  const resolvers = pendingStopResolvers.slice();
  pendingStopResolvers = [];
  for (const fn of resolvers) {
    try { fn(result); } catch (_) {}
  }
}

/**
 * Handle stopping recording and saving to IndexedDB
 */
async function finalizeAndSaveRecording(mimeType = 'video/webm') {
  if (isSavingRecording) return;
  isSavingRecording = true;
  console.log('finalizeAndSaveRecording: recordedChunks count:', recordedChunks ? recordedChunks.length : 0);

  try {
    if (!recordedChunks || recordedChunks.length === 0) {
      console.warn('No recorded chunks found to save.');
      cleanupAllResources();
      resolveAllPendingStops({ success: false, error: 'No video frames recorded' });
      return;
    }

    const finalBlob = new Blob(recordedChunks, { type: mimeType });
    const recordingId = 'rec_' + Date.now();
    const duration = Math.max(1000, Date.now() - recordingStartTime);

    const recordingRecord = {
      id: recordingId,
      blob: finalBlob,
      mimeType,
      size: finalBlob.size,
      duration,
      timestamp: Date.now(),
      resolution: recordingOptions.resolution || '1080p',
      fps: recordingOptions.fps || 60
    };

    if (window.RecorderDB) {
      console.log('Saving to IndexedDB...', recordingId, finalBlob.size, 'bytes');
      await window.RecorderDB.saveRecording(recordingRecord);
      console.log('Saved to IndexedDB and committed to disk:', recordingId);
    }

    cleanupAllResources();

    // Notify background to open preview tab with saved video
    await chrome.runtime.sendMessage({
      action: 'RECORDING_FINISHED_SUCCESS',
      recordingId,
      duration,
      size: finalBlob.size,
      resolution: recordingOptions.resolution || '1080p'
    }).catch(() => {});

    resolveAllPendingStops({ success: true, recordingId });
  } catch (error) {
    console.error('Error saving recording to DB:', error);
    await chrome.runtime.sendMessage({
      action: 'RECORDING_FAILED',
      error: 'Failed to process and save recorded video: ' + error.message
    }).catch(() => {});
    resolveAllPendingStops({ success: false, error: error.message });
  } finally {
    isSavingRecording = false;
    cleanupAllResources();
  }
}

function pauseRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.pause();
    return { success: true };
  }
  return { success: false };
}

function resumeRecording() {
  if (mediaRecorder && mediaRecorder.state === 'paused') {
    mediaRecorder.resume();
    return { success: true };
  }
  return { success: false };
}

function stopRecording() {
  console.log('offscreen.js: stopRecording requested. isSavingRecording:', isSavingRecording);

  return new Promise((resolve) => {
    pendingStopResolvers.push(resolve);

    if (isSavingRecording) {
      return;
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        if (mediaRecorder.state === 'recording') {
          try { mediaRecorder.requestData(); } catch (_) {}
        }
        mediaRecorder.stop();
        return;
      } catch (e) {
        console.warn('Error calling mediaRecorder.stop():', e);
      }
    }

    finalizeAndSaveRecording(getSupportedMimeType());
  });
}

function cleanupCaptureTracks() {
  if (rawTabStream) {
    rawTabStream.getTracks().forEach((track) => {
      try { track.stop(); } catch (e) {}
    });
    rawTabStream = null;
  }
  if (micStream) {
    micStream.getTracks().forEach((track) => {
      try { track.stop(); } catch (e) {}
    });
    micStream = null;
  }
  if (combinedStream) {
    combinedStream.getTracks().forEach((track) => {
      try { track.stop(); } catch (e) {}
    });
    combinedStream = null;
  }
}

function cleanupAllResources() {
  cleanupCaptureTracks();

  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
  mediaRecorder = null;
}

// Message Dispatcher
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') return false;

  switch (message.action) {
    case 'START_RECORDING':
      startRecording(message).then(sendResponse);
      return true;

    case 'PAUSE_RECORDING':
      sendResponse(pauseRecording());
      return false;

    case 'RESUME_RECORDING':
      sendResponse(resumeRecording());
      return false;

    case 'STOP_RECORDING':
      stopRecording().then(sendResponse);
      return true;

    case 'GET_RECORDING_STATUS':
      sendResponse({
        state: mediaRecorder ? mediaRecorder.state : 'inactive',
        duration: recordingStartTime ? Date.now() - recordingStartTime : 0
      });
      return false;

    default:
      return false;
  }
});
