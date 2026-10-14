/**
 * Offscreen Document Script for 1080p Tab Video & Audio Recording
 */

let mediaRecorder = null;
let recordedChunks = [];
let combinedStream = null;
let rawTabStream = null;
let micStream = null;
let audioContext = null;
let recordingStartTime = 0;
let recordingDuration = 0;
let recordingTimerInterval = null;
let recordingOptions = {};

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
 * Starts recording a tab at 1080p Full HD
 */
async function startRecording(message) {
  try {
    const { streamId, resolution = '1080p', fps = 60, includeTabAudio = true, includeMic = false } = message;
    recordingOptions = { resolution, fps, includeTabAudio, includeMic };

    let width = 1920;
    let height = 1080;
    if (resolution === '720p') {
      width = 1280;
      height = 720;
    }

    const videoBitrate = (resolution === '1080p' && fps >= 60) ? 12000000 : 8000000;

    // 1. Capture the tab stream via streamId
    rawTabStream = await navigator.mediaDevices.getUserMedia({
      audio: includeTabAudio ? {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      } : false,
      video: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId,
          minWidth: width,
          maxWidth: width,
          minHeight: height,
          maxHeight: height,
          minFrameRate: fps,
          maxFrameRate: fps
        }
      }
    });

    audioContext = new AudioContext();
    const audioDestination = audioContext.createMediaStreamDestination();

    // 2. Tab Audio routing (prevent tab audio from going silent to the user)
    const tabAudioTracks = rawTabStream.getAudioTracks();
    if (includeTabAudio && tabAudioTracks.length > 0) {
      const tabAudioSource = audioContext.createMediaStreamSource(new MediaStream(tabAudioTracks));
      // Connect to speakers so user can still hear tab
      tabAudioSource.connect(audioContext.destination);
      // Connect to recorder
      tabAudioSource.connect(audioDestination);
    }

    // 3. Optional Microphone mixing
    if (includeMic) {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const micSource = audioContext.createMediaStreamSource(micStream);
        micSource.connect(audioDestination);
      } catch (err) {
        console.warn('Microphone permission or capture failed, continuing with tab audio only:', err);
      }
    }

    // 4. Combine video tracks with destination audio
    const outputTracks = [...rawTabStream.getVideoTracks()];
    if (includeTabAudio || includeMic) {
      const mixedAudioTracks = audioDestination.stream.getAudioTracks();
      if (mixedAudioTracks.length > 0) {
        outputTracks.push(mixedAudioTracks[0]);
      }
    }

    combinedStream = new MediaStream(outputTracks);

    // Watch for stream termination
    combinedStream.getVideoTracks()[0].onended = () => {
      console.log('Tab video track ended');
      stopRecording();
    };

    // 5. Initialize MediaRecorder
    recordedChunks = [];
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
      await handleRecordingFinished(mimeType);
    };

    // Collect data every second for smooth memory handling
    mediaRecorder.start(1000);
    recordingStartTime = Date.now();

    // Notify background that recording started successfully
    chrome.runtime.sendMessage({
      action: 'RECORDING_STARTED_CONFIRMED',
      resolution: `${width}x${height}`,
      fps
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to start recording in offscreen document:', error);
    chrome.runtime.sendMessage({
      action: 'RECORDING_FAILED',
      error: error.message || 'Failed to capture tab media stream.'
    });
    cleanupResources();
    return { success: false, error: error.message };
  }
}

/**
 * Handle stopping recording and saving to IndexedDB
 */
async function handleRecordingFinished(mimeType) {
  try {
    const finalBlob = new Blob(recordedChunks, { type: mimeType });
    const recordingId = 'rec_' + Date.now();
    const duration = Date.now() - recordingStartTime;

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
      await window.RecorderDB.saveRecording(recordingRecord);
    }

    chrome.runtime.sendMessage({
      action: 'RECORDING_FINISHED_SUCCESS',
      recordingId,
      duration,
      size: finalBlob.size,
      resolution: recordingOptions.resolution || '1080p'
    });
  } catch (error) {
    console.error('Error saving recording to DB:', error);
    chrome.runtime.sendMessage({
      action: 'RECORDING_FAILED',
      error: 'Failed to process and save recorded video.'
    });
  } finally {
    cleanupResources();
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
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    return { success: true };
  }
  cleanupResources();
  return { success: false };
}

function cleanupResources() {
  if (rawTabStream) {
    rawTabStream.getTracks().forEach((track) => track.stop());
    rawTabStream = null;
  }
  if (micStream) {
    micStream.getTracks().forEach((track) => track.stop());
    micStream = null;
  }
  if (combinedStream) {
    combinedStream.getTracks().forEach((track) => track.stop());
    combinedStream = null;
  }
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
  mediaRecorder = null;
}

// Message Dispatcher
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') return;

  switch (message.action) {
    case 'START_RECORDING':
      startRecording(message).then(sendResponse);
      return true; // async sendResponse

    case 'PAUSE_RECORDING':
      sendResponse(pauseRecording());
      break;

    case 'RESUME_RECORDING':
      sendResponse(resumeRecording());
      break;

    case 'STOP_RECORDING':
      sendResponse(stopRecording());
      break;

    case 'GET_RECORDING_STATUS':
      sendResponse({
        state: mediaRecorder ? mediaRecorder.state : 'inactive',
        duration: recordingStartTime ? Date.now() - recordingStartTime : 0
      });
      break;

    default:
      break;
  }
});
