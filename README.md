<div align="center">
  <img src="icons/icon128.png" alt="Apertur Logo" width="88" height="88" />
  <h1>Apertur (v2.0)</h1>
  <p><strong>Free Open-Source 1080p 60 FPS Screen, Window &amp; Workflow Recorder for Chrome</strong></p>
  <p>
    Cinema-grade browser, window, and desktop capture with 60Hz cursor highlights, a 3-second countdown overlay, built-in video trimming, click-to-rename titles, 3-way PNG screenshots, and 100% local IndexedDB storage.
  </p>
  <p>
    <a href="https://tahsinsoyak.github.io/apertur/"><strong>🌐 Live Interactive Demo &amp; Landing Page</strong></a>
    &nbsp;•&nbsp;
    <a href="https://github.com/tahsinsoyak/apertur/releases/latest"><strong>📦 Download Extension v2.0.0 (.zip)</strong></a>
    &nbsp;•&nbsp;
    <a href="https://github.com/tahsinsoyak/apertur/issues"><strong>🐛 Report Bug / Request Feature</strong></a>
  </p>
</div>

---

## ✨ Why Apertur?

Most screen recorders force you to choose between **expensive cloud subscriptions ($15 to $29/month)** that upload your private screen recordings to third-party servers, or **fragile browser tab extensions** that drop the recording or lose their control bar the moment a website redirects or opens an OAuth login page.

**Apertur v2.0** is engineered on **Chrome Manifest V3 Offscreen Documents** with a precision **Daylight Studio** interface:

- **🛡️ Redirect-Safe Window & Screen Capture**: Survives multi-page logins, OAuth redirects, and full-app workflows. Your floating recording HUD and cursor spotlight automatically re-attach after every navigation.
- **🎬 1080p 60 FPS VP9 Master Engine**: Hardware-accelerated WebM video encoding up to **12 Mbps** (`video/webm;codecs=vp9,opus`) paired with **192 kbps** studio-mixed system and microphone audio.
- **🎯 60Hz Cursor Spotlight & Click Physics**: GPU-composited cursor halo and expanding click shockwave ripples in 5 studio color themes (`Amber`, `Blue`, `Purple`, `Red`, `Green`) that can be toggled live mid-recording.
- **⏱️ Optional 3-Second Countdown Overlay (`3 - 2 - 1`)**: Full-screen animated countdown right after selecting your window, screen, or tab so your mouse is positioned before recording begins.
- **✂️ Built-In Video Trim Studio**: Interactive **Start** and **End** range sliders in the Video Player Studio let you preview a trimmed segment and save a clean trimmed `.webm` copy directly to your local library.
- **✏️ Click-to-Rename Video Titles**: Click any recording title or the pencil icon in the player to rename it inline. Custom titles persist in IndexedDB, appear in **My Saved Videos**, and name your downloaded `.webm` and `.png` files automatically.
- **📸 Instant PNG Screenshots (3 Ways to Capture)**: Snap full-resolution PNG screenshots from the **Extension Popup header**, from the **in-page Floating Recording HUD** while recording, or from **any exact video frame** inside the player studio.
- **🔒 100% Private Local Storage**: Zero cloud uploads, zero accounts, zero watermarks, and no 5-minute time caps. Everything stays on your machine inside IndexedDB (`RecorderDB`).

---

## 🚀 Quick Start (2 Ways to Install)

### Option A: Instant Release Download (No Terminal Needed)
1. Download **[`apertur-v2.0.0-chrome-extension.zip`](https://github.com/tahsinsoyak/apertur/releases/latest)** from the latest GitHub Release and extract the ZIP folder.
2. Open Chrome (or Brave, Edge, Arc) and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** and select the extracted folder.

### Option B: Build from Source
```bash
git clone https://github.com/tahsinsoyak/apertur.git
cd apertur
node build.js
```
Then open `chrome://extensions/`, enable **Developer mode**, click **Load unpacked**, and select the generated **`dist/`** directory.

---

## 🛠️ Complete Feature Overview

### 1. Three Recording Modes
| Mode | Best For | Survives Page Redirects? | Audio Support |
| :--- | :--- | :--- | :--- |
| **Browser Window (`Recommended`)** | Full browser workflows, OAuth logins, multi-page testing | ✅ **Yes (100% Continuous)** | System/Tab Audio + Mic |
| **Entire Screen** | Multi-window demos, IDE + terminal + browser workflows | ✅ **Yes (100% Continuous)** | System Audio + Mic |
| **This Tab Only (`1-Click`)** | Quick single-page clips without a screen picker dialog | ⚠️ Stops if tab navigates | Tab Audio (Unmuted) + Mic |

### 2. Live In-Page Recording Controls & Visual Helpers
- **Frosted Porcelain Floating HUD**: Draggable in-page control bar showing a live recording indicator, `MM:SS` timer, **Pause / Resume**, **Cursor FX Toggle**, **Instant PNG Screenshot**, and **Finish**.
- **5 Studio Cursor Color Themes**: Switch between `Amber (#f59e0b)`, `Blue (#06b6d4)`, `Purple (#8b5cf6)`, `Red (#e11d48)`, and `Green (#10b981)` in the popup before or during a session.
- **3-Second Countdown Toggle**: Enable or disable the `3 - 2 - 1` pre-roll overlay right from the popup's Visual Helpers card.

### 3. Video Player Studio & Local Library (`preview/preview.html`)
- **Zero-Scroll Theater Player**: Fitted `calc(100vh - 64px)` viewport layout so watching, trimming, and exporting recordings never triggers unnecessary vertical scrolling.
- **Click-to-Rename Recording Title**: Click the recording title (`#recordingTitle`) or pencil button (`#btnRenameTitle`), type a custom name, and press `Enter` (or click away) to save to IndexedDB.
- **Trim Start / End Studio Bar**:
  - Drag the **Start** and **End** sliders (`0.1s` precision) to isolate the exact portion of your recording.
  - Click **Preview** to play only the selected range, **Reset** to restore full bounds, or **Save Trimmed Copy** to re-encode and store a trimmed `.webm` clip in IndexedDB.
- **Frame PNG Export**: Pause at any moment and click **Frame PNG** (`#btnSnapshot`) to export the exact video frame at native `1920x1080` or `1280x720` resolution.
- **My Saved Videos Gallery**: Browse all locally stored recordings with live hover video previews, duration/resolution badges, recording count pill, 1-click `.webm` downloads, individual delete, and **Clear All**.

### 4. Instant PNG Screenshots (3 Entry Points)
1. **Popup Header Camera Button (`#btnQuickScreenshot`)**: Capture the currently visible tab as a lossless `.png` with a single click without starting a video recording.
2. **In-Page Recording HUD Camera Button (`#__tr_btn_screenshot__`)**: Take high-resolution screenshots of key steps while your 60 FPS video continues recording uninterrupted.
3. **Player Studio Frame Button (`#btnSnapshot`)**: Extract a crisp `.png` still frame from any recorded video in your library.

---

## 🏗️ Architecture & Repository Structure

```text
apertur/
├── background/
│   └── background.js      # MV3 Service Worker: stream orchestration, tab navigation re-injection & PNG tab capture
├── content/
│   ├── content.js         # 60Hz Cursor Spotlight, Click Shockwaves, 3-2-1 Countdown Overlay & Floating HUD
│   └── content.css        # Hardware-accelerated CSS animations for cursor halo, ripples, countdown & HUD
├── icons/
│   ├── icon.svg           # Master Cinema Aperture vector artwork
│   └── icon*.png          # Multi-resolution extension icons (16px, 32px, 48px, 128px)
├── landing/
│   ├── index.html         # SEO-optimized product landing page & interactive cursor playground
│   ├── landing.css        # Daylight Studio design system & responsive Bento grid styles
│   └── landing.js         # Interactive 60Hz cursor physics & simulated HUD controller
├── offscreen/
│   ├── offscreen.html     # Manifest V3 Offscreen Document host
│   └── offscreen.js       # WebAudio API dual-channel mixer + 12 Mbps VP9 MediaRecorder engine
├── popup/
│   ├── popup.html         # Zero-scroll Daylight Studio popup interface
│   ├── popup.css          # Compact 360px popup styling with segmented controls & switches
│   └── popup.js           # Capture mode selector, countdown/cursor toggles, live telemetry & quick PNG snap
├── preview/
│   ├── preview.html       # Video Player Studio & Local IndexedDB Video Library
│   ├── preview.css        # Locked-viewport theater player, trim studio bar & responsive gallery cards
│   └── preview.js         # Inline title renaming, Trim Start/End re-encoder, frame PNG export & gallery manager
├── utils/
│   └── db.js              # Promise-based IndexedDB storage engine (RecorderDB: save, rename, list, delete)
├── build.js               # Zero-dependency production bundler -> generates dist/
├── demo.html              # Interactive sandbox page for testing recording, audio, and redirects locally
├── render-icons.js        # Icon generation utility for multi-resolution PNG assets
├── test-server.js         # Local HTTP test server for verifying multi-page redirects and recording flows
├── package.json           # Project metadata and npm scripts (build, test-server)
└── manifest.json          # Chrome Extension Manifest V3 configuration (v2.0.0)
```

---

## 🧪 Local Development & Sandbox Testing

```bash
# 1. Build the production extension into dist/
npm run build
# (or: node build.js)

# 2. Launch the local test server & interactive recording sandbox (demo.html)
npm run test-server
# (or: node test-server.js)
```

---

## 🌐 Live Website & Interactive Playground

- **GitHub Pages Live Site**: **[https://tahsinsoyak.github.io/apertur/](https://tahsinsoyak.github.io/apertur/)**
- Includes an interactive **60Hz Cursor & Click Physics Playground** where you can test all 5 cursor spotlight colors, click shockwaves, and the simulated recording HUD directly in your browser.
- You can also open the landing page anytime from inside the extension popup by clicking the **Globe icon** in the top bar.

---

## 📄 License

Released under the [MIT License](LICENSE). 100% free forever for personal, educational, and commercial use.
