<div align="center">
  <img src="icons/icon128.png" alt="Apertur Logo" width="88" height="88" />
  <h1>Apertur</h1>
  <p><strong>Free Open-Source 1080p 60 FPS Screen &amp; Workflow Recorder for Chrome</strong></p>
  <p>
    Cinema-grade browser, window, and desktop capture with real-time 60Hz cursor highlights, redirect-safe controls, and 100% local video storage.
  </p>
</div>

---

## ✨ Why Apertur?

Most screen recorders force you to choose between **expensive cloud subscriptions ($15 to $29/mo)** that upload your private recordings to third-party servers, or **basic browser extensions** that stop working the moment a page redirects or navigates.

**Apertur** is built on **Chrome Manifest V3 Offscreen Documents** with a clean **Daylight Studio** interface:

- **🛡️ Redirect-Safe Window & Screen Capture**: Survives multi-page logins, OAuth redirects, and full-app workflows. Your floating Pause/Finish bar and cursor spotlight automatically re-attach after every navigation.
- **🎬 1080p 60 FPS VP9 Master Engine**: Hardware-accelerated WebM video encoding up to **12 Mbps** with **192 kbps** mixed system and microphone audio.
- **🎯 60Hz Cursor Spotlight & Click Physics**: GPU-composited cursor aura and click shockwave ripples in 5 studio color themes (`Amber`, `Blue`, `Purple`, `Red`, `Green`).
- **🔒 100% Private Local Storage**: Zero cloud uploads, zero accounts, zero watermarks, and no 5-minute time caps. Watch in the built-in video player or download `.webm` files with one click.

---

## 🚀 Quick Start (Install in 30 Seconds)

### 1. Clone & Build
```bash
git clone https://github.com/tahsinsoyak/apertur.git
cd apertur
node build.js
```

### 2. Load into Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked** and select the generated **`dist/`** directory

---

## 🧭 Recording Modes

| Mode | Best For | Survives Page Redirects? |
| :--- | :--- | :--- |
| **Browser Window (`Recommended`)** | Full browser workflows, OAuth logins, multi-page testing | ✅ **Yes (100% Continuous)** |
| **Entire Screen** | Multi-window demos, terminal + browser workflows | ✅ **Yes (100% Continuous)** |
| **This Tab Only (`1-Click`)** | Quick single-page clips without picker dialog | ⚠️ Stops if tab navigates |

---

## 📂 Repository Structure

```text
apertur/
├── background/        # MV3 Service Worker (stream orchestration & navigation persistence)
├── content/           # 60Hz Cursor Spotlight, Click Shockwaves & Frosted Porcelain HUD
├── icons/             # Master Cinema Aperture vector SVG & multi-resolution PNGs
├── landing/           # SEO-Optimized Open-Source Landing Page & Interactive Playground
├── offscreen/         # MV3 Offscreen Document (WebAudio mixer + 12 Mbps VP9 MediaRecorder)
├── popup/             # Daylight Studio Popup Controller
├── preview/           # Video Player & Local IndexedDB Video Library
├── utils/             # Local IndexedDB storage engine (RecorderDB)
├── build.js           # Zero-dependency production bundler -> dist/
└── manifest.json      # Chrome Extension Manifest V3
```

---

## 🌐 Product Landing Page

Apertur includes a complete, SEO-optimized product landing page with an interactive cursor-physics playground at [`landing/index.html`](landing/index.html). You can open it directly from the extension popup (click the globe icon) or deploy the `landing/` directory to GitHub Pages or Vercel.

---

## 📄 License

Released under the [MIT License](LICENSE). Free forever for personal and commercial use.
