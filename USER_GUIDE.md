# Apertur: Complete User Guide & Documentation

Welcome to **Apertur**, the free, open-source 1080p 60 FPS screen recorder and lossless screenshot suite for Google Chrome and Chromium-based browsers (Brave, Edge, Arc, Opera, Vivaldi).

This guide walks you through every feature, workflow, and setting available in Apertur.

---

## 📑 Table of Contents

1. [Quick Installation](#1-quick-installation)
2. [What to Record: 3 Recording Modes](#2-what-to-record-3-recording-modes)
3. [Audio Setup & Live VU Level Meter](#3-audio-setup--live-vu-level-meter)
4. [Visual Helpers & Cursor FX](#4-visual-helpers--cursor-fx)
5. [In-Recording Controls & Floating HUD](#5-in-recording-controls--floating-hud)
6. [Screenshot Suite (3 Capture Modes)](#6-screenshot-suite-3-capture-modes)
7. [Screenshot Annotation Studio](#7-screenshot-annotation-studio)
8. [Video Player Studio & Trimmer](#8-video-player-studio--trimmer)
9. [Export Presets & Formats](#9-export-presets--formats)
10. [Private Local Media Vault](#10-private-local-media-vault)
11. [Global Keyboard Shortcuts](#11-global-keyboard-shortcuts)
12. [Troubleshooting & FAQ](#12-troubleshooting--faq)

---

## 1. Quick Installation

### Option A: Unpacked Extension (Recommended)
1. Download or clone this repository to your computer:
   ```bash
   git clone https://github.com/tahsinsoyak/apertur.git
   cd apertur
   node build.js
   ```
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the `dist/` directory (or repository root).
5. Click the puzzle icon in Chrome's toolbar and pin **Apertur** for easy 1-click access.

---

## 2. What to Record: 3 Recording Modes

Click the Apertur icon in your Chrome toolbar to open the **Daylight Studio** controller. Choose the capture mode that matches your workflow:

| Recording Mode | Best For | Survives Redirects & Logins? | System Audio | Microphone |
| :--- | :--- | :---: | :---: | :---: |
| **Browser Window** *(Recommended)* | SaaS walkthroughs, OAuth login flows, multi-tab browsing | **Yes (100% Continuous)** | Tab / Window Audio | Yes |
| **Entire Screen** | Full desktop demos, code editors, terminals, multi-app testing | **Yes (100% Continuous)** | System Audio | Yes |
| **This Tab Only** *(1-Click)* | Rapid single-page recordings without showing a picker dialog | Stops if tab navigates | Tab Audio (Unmuted) | Yes |

> [!TIP]
> **Why Browser Window mode is recommended**: Most extensions crash or stop when you navigate between pages or authenticate with Google/GitHub OAuth. In **Browser Window** mode, Apertur runs on background offscreen hardware and re-attaches your floating HUD and cursor effects seamlessly across every navigation.

---

## 3. Audio Setup & Live VU Level Meter

Apertur features a professional studio audio mixing engine:

### Tab & System Sound
* **Tab Sound Toggle**: Captures internal website audio, videos, game audio, or meeting participants.
* When recording in **This Tab Only** mode, Apertur loops tab audio back to your speakers so you can still hear the audio while recording.

### Microphone Configuration Drawer
When you check **Microphone**, Apertur opens the advanced audio configuration drawer:
1. **Microphone Device Picker**: Choose specifically between your built-in laptop mic, USB headset, or studio condenser microphone from the dropdown.
2. **Live VU Audio Level Meter**: Speak into your microphone—a reactive gradient meter (`Green` -> `Amber` -> `Red`) confirms audio detection in real-time before you begin recording.
3. **Gain Boost Slider (50% to 200%)**: Boost quiet microphone signals without external preamp hardware.
4. **Noise Filter**: Hardware-accelerated WebRTC noise suppression and echo cancellation to remove background fan noise and room hiss.

---

## 4. Visual Helpers & Cursor FX

Keep your audience focused on exactly where you are clicking:

* **60Hz Cursor Halo**: A smooth GPU-composited spotlight tracks your mouse at 60 FPS.
* **Click Shockwave Ripples**: Visual expanding ripples burst whenever you click, providing clear visual feedback in tutorial videos.
* **5 Studio Theme Colors**:
  * 🟡 **Amber** (`#f59e0b`)
  * 🔵 **Cyan** (`#06b6d4`)
  * 🟣 **Purple** (`#8b5cf6`)
  * 🔴 **Red** (`#e11d48`)
  * 🟢 **Green** (`#10b981`)
* **Interactive Playground**: Test your cursor theme and click animations directly in the popup before recording.
* **3-Second Countdown Overlay**: Displays an animated `3, 2, 1` overlay on your screen right after you select your capture target, giving you time to position your hands.

---

## 5. In-Recording Controls & Floating HUD

When recording starts, Apertur attaches a clean floating toolbar on your active page:

* **Timer Readout**: Tracks elapsed recording time (`MM:SS`).
* **Pause / Resume**: Temporarily freeze recording to review notes or switch accounts without splitting your video into multiple files.
* **Quick Snap**: Captures a crystal-clear PNG screenshot of the current page while recording continues in the background.
* **Finish & Save**: Stops recording, cleanly finalizes the VP9 video container, and immediately opens the **Video Player Studio**.

---

## 6. Screenshot Suite (3 Capture Modes)

Apertur includes a lossless PNG screenshot suite accessible via the popup header or global keyboard shortcuts:

### 1. Selected Area (Snip) — <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd>
* Click and drag to crop any rectangular region on the screen.
* Live dimension HUD displays the exact pixel width and height (e.g. `1280 × 720 px`).
* Floating action toolbar gives instant choices:
  * **Copy**: Copies the PNG directly to your system clipboard for pasting into Slack, GitHub, or Notion.
  * **Save PNG**: Downloads the cropped image immediately.
  * **Library**: Stores the screenshot directly into your local Apertur Media Vault.
  * **Esc**: Dismisses the snip overlay with zero interruptions.

### 2. Full Webpage Scrolling — <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd>
* Automatically scrolls down long articles, code reviews, or landing pages.
* Takes pixel-perfect viewport slices and stitches them into one uninterrupted, lossless PNG image.

### 3. Visible Viewport — <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd>
* 1-click snapshot of your active viewport.
* Automatically copies to clipboard if the auto-copy checkbox is enabled.

---

## 7. Screenshot Annotation Studio

Inspect, mark up, and call out bugs directly inside Apertur's **Screenshot Viewer Modal**:

1. Click any screenshot in your **Media Library** to open the viewer.
2. Click the **Annotate** button in the top action bar to enter editing mode.
3. Select from 5 purpose-built annotation tools:
   * ✏️ **Pen**: Freehand drawing with smooth line physics.
   * ↗️ **Arrow**: Draw crisp directional callout arrows to point out UI elements.
   * 🔲 **Box**: Highlight areas with rectangular outline frames.
   * 🟡 **Highlighter**: Semi-transparent marker for emphasizing text.
   * 🔤 **Text**: Click anywhere on the screenshot to add high-contrast callout labels.
4. **Custom Styling**:
   * Choose from 5 studio colors (`Amber`, `Red`, `Cyan`, `Purple`, `Green`).
   * Select stroke thickness: **S** (Fine / 3px), **M** (Normal / 5px), or **L** (Bold / 9px).
5. **Undo & History**:
   * Click **Undo** to step backward through changes.
   * Click **Clear** to reset the image to its original state.
6. **Save & Export**:
   * Click **Save to Library** to update the screenshot in your local IndexedDB storage.
   * Click **Copy Image** or **Download PNG** to export the annotated result with all markup baked in.

---

## 8. Video Player Studio & Trimmer

After finishing a recording, the **Video Player Studio** (`preview/preview.html`) opens automatically:

* **Cinema Theater Player**: Watch your recording with custom playback speed controls (`1x`, `1.25x`, `1.5x`, `2x`).
* **Start & End Trimming Sliders**:
  * Drag the **Start** slider to trim dead time or delay before you started speaking.
  * Drag the **End** slider to cut awkward pauses at the end.
  * Click **Preview Cut** to play only the selected range.
  * Click **Save Trimmed Video** to re-encode and save a trimmed `.webm` directly to your library.
* **Click-to-Rename Titles**: Click the video title or the pencil icon to rename your clip. The custom title persists in IndexedDB and names all downloaded files automatically.
* **Frame Snapshot**: Click the **Screenshot** button under the player to grab any paused video frame as a lossless PNG.

---

## 9. Export Presets & Formats

Beside the **Download Video** button, click the export preset caret (`▾`) to choose the ideal output format:

1. **🎬 Master 1080p (VP9 60fps)**:
   * Original highest quality hardware-accelerated WebM master.
   * Bitrate up to 12 Mbps for razor-sharp text and zero compression artifacts.
2. **🌐 Web-Ready 720p (Compact)**:
   * Downscaled to 1280 × 720 at ~2.5 Mbps.
   * Lightweight file size ideal for Slack, Discord, Microsoft Teams, and email attachments.
3. **🎵 Audio Only (WebM / Opus)**:
   * Extracts the voice and system audio track without video data.
   * Perfect for podcast clips, voice notes, or meeting audio logs.
4. **🎞️ Short Animated Loop (WebM Loop)**:
   * Exports a compact 5-second preview loop designed for GitHub READMEs and pull request demos.

---

## 10. Private Local Media Vault

Click **My Media** in the popup or navigate to `preview/preview.html?view=gallery` to access your library:

* **100% Offline & Private**: All videos and screenshots are stored securely inside your browser's IndexedDB (`RecorderDB`). No data is ever sent to external cloud servers.
* **Category Filters**: Filter your library by **All Media**, **Videos**, or **Screenshots**.
* **Hover Video Previews**: Hover over any video card to preview the playback immediately.
* **100% Zoom Full-Resolution Viewer**: Click any screenshot to open the inspector. Toggle between **Fit Screen** and **100% Size** to pan through tall full-page screenshots at native 1:1 pixel resolution.

---

## 11. Global Keyboard Shortcuts

Apertur shortcuts work globally across all regular web pages:

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd> | **Area Crop (Snip)** | Click and drag crosshairs to crop any rectangular area |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> | **Full Webpage** | Automatically scrolls and stitches the entire webpage into one PNG |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> | **Visible Viewport** | Instant 1-click snapshot of the current view |
| <kbd>Esc</kbd> | **Cancel Snip** | Instantly dismisses active area snipping |

> [!NOTE]
> You can customize these shortcuts anytime by visiting `chrome://extensions/shortcuts` in your browser.

---

## 12. Troubleshooting & FAQ

#### Q: Why can't I record `chrome://` or Chrome Web Store pages?
* **A**: Chrome's internal security policy strictly prohibits all browser extensions from executing content scripts on `chrome://*`, `chrome-extension://*`, or `chromewebstore.google.com`. Switch to **Browser Window** mode or navigate to any standard website (`http://` or `https://`).

#### Q: How do I fix a "Locked Tab" message?
* **A**: If Chrome locked an active tab from an interrupted session, click **Fix Locked Tab & Reload** in the popup error banner, or simply refresh the tab.

#### Q: Are my recordings limited to 5 minutes?
* **A**: **No.** Apertur has zero artificial time limits, zero paywalls, and zero watermarks. Recordings continue as long as your disk has storage space.

#### Q: Where are my files stored?
* **A**: Videos and screenshots are saved locally in your browser's IndexedDB database. When you click **Download**, files are saved directly to your computer's default `Downloads` folder.
