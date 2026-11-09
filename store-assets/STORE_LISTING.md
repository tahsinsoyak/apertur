# Chrome Web Store Listing: Apertur

Copy and paste these fields into the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
Upload package: `release/apertur-v<version>-chrome-web-store.zip` (generate it with `npm run package`).

---

## 1. Store listing tab

### Item name (from manifest, max 75 chars)
```
Apertur: 60 FPS Screen & Workflow Recorder
```

### Summary (from manifest `description`, max 132 chars)
```
Free 1080p 60 FPS screen & window recorder with cursor spotlights, video trimmer, 3s countdown, PNG screenshots & local storage.
```

### Description
```
Apertur is a free, open-source screen recorder and screenshot tool for Chrome. Record smooth 1080p 60 FPS videos of your browser, a window, or your entire screen. Everything stays on your computer: no account, no cloud uploads, no watermarks, no time limits.

🎬 RECORD IN 1080p 60 FPS
• Three modes: Browser Window (recommended), Entire Screen, or This Tab Only
• Browser Window mode keeps recording through logins, OAuth redirects and multi-page workflows
• High-quality VP9 video up to 12 Mbps with 192 kbps audio
• Tab/system audio plus microphone, with a live level meter and 50–200% mic gain
• Optional 3-2-1 countdown so your cursor is ready before recording starts
• Floating on-page control bar: pause, resume, finish, or snap a screenshot

🎯 MAKE YOUR CLICKS EASY TO FOLLOW
• Smooth cursor spotlight that follows your mouse
• Click ripple effects in 5 colors, great for tutorials, bug reports and demos

✂️ TRIM AND EXPORT INSTANTLY
• Built-in video player with start/end trim sliders
• One-click export presets: 1080p master, 720p web-ready, audio-only, or a looping clip
• Rename and download recordings as WebM

📸 SCREENSHOTS IN 3 WAYS
• Visible area: Alt+Shift+V
• Selected area (snip): Alt+Shift+A
• Full scrolling web page: Alt+Shift+F
• Annotation studio: pen, arrows, boxes, highlighter and text
• Copy to clipboard, download as lossless PNG, or keep in your library

🔒 100% PRIVATE BY DESIGN
• Recordings and screenshots are stored only on your device (IndexedDB)
• No sign-up, no analytics, no tracking, no ads
• No data ever leaves your computer
• Open source (MIT): read every line of code on GitHub

PERFECT FOR
Developers filing bug reports • QA testers • Teachers and students • Product demos • Customer support • Async team updates • Anyone who wants a free Loom alternative that respects privacy

Open source: https://github.com/tahsinsoyak/apertur
Website: https://tahsinsoyak.github.io/apertur/
Privacy policy: https://tahsinsoyak.github.io/apertur/privacy.html

Apertur is free forever. If it saves you time, consider supporting development on Patreon: https://www.patreon.com/tahsinsoyak
```

### Category
`Productivity` → sub-category **Tools** (alternative: "Workflow & Planning")

### Language
`English`

### Graphic assets (all in `store-assets/chrome-web-store/`)
| Field | File | Size |
|---|---|---|
| Store icon | `store-icon-128.png` | 128×128 |
| Screenshot 1 | `screenshot-1-popup-studio.jpg` | 1280×800 |
| Screenshot 2 | `screenshot-2-live-recording.jpg` | 1280×800 |
| Screenshot 3 | `screenshot-3-player-trimmer.jpg` | 1280×800 |
| Screenshot 4 | `screenshot-4-area-snip.jpg` | 1280×800 |
| Screenshot 5 | `screenshot-5-local-library.jpg` | 1280×800 |
| Small promo tile | `promo-small-440x280.jpg` | 440×280 |
| Marquee promo tile | `promo-marquee-1400x560.jpg` | 1400×560 |

Regenerate any time with `npm run store:assets`.

### Additional fields
| Field | Value |
|---|---|
| Official URL | *(optional, requires Google Search Console verification)* `https://tahsinsoyak.github.io/apertur/` |
| Homepage URL | `https://tahsinsoyak.github.io/apertur/` |
| Support URL | `https://github.com/tahsinsoyak/apertur/issues` |
| Mature content | No |

---

## 2. Privacy practices tab

### Single purpose description
```
Apertur records the user's screen, browser window, or tab as a video, and captures screenshots of web pages, saving everything locally on the user's device for preview, trimming, annotation, and download.
```

### Permission justifications

**tabCapture**
```
Used for the "This Tab Only" recording mode. When the user clicks Start Recording, chrome.tabCapture.getMediaStreamId obtains a video/audio stream of the active tab, which is encoded locally into a WebM file. Capture never starts without an explicit user action.
```

**offscreen**
```
Manifest V3 service workers cannot use MediaRecorder or getDisplayMedia. An offscreen document (reasons: USER_MEDIA, DISPLAY_MEDIA) hosts the MediaRecorder that encodes the user's recording and mixes optional microphone audio. It is created when recording starts and closed when it ends.
```

**activeTab**
```
Grants temporary access to the current tab when the user clicks the toolbar icon or presses a keyboard shortcut (Alt+Shift+V/A/F), so Apertur can capture a screenshot of that page and show the area-selection overlay.
```

**scripting**
```
Injects Apertur's own bundled content script and stylesheet (content/content.js, content/content.css) into the page only when needed: to show the recording control bar, cursor spotlight and click ripples during a recording, the 3-2-1 countdown overlay, the area-snip selector, and the full-page screenshot scroller. No remote code is ever executed.
```

**storage**
```
Saves user preferences (resolution, frame rate, cursor color, toggles) and temporary recording state (recording/paused, start time) in chrome.storage.local so settings persist and the timer stays correct if the service worker restarts. Nothing is synced or transmitted.
```

**clipboardWrite**
```
Lets the user copy a captured screenshot to the clipboard as a PNG image ("Copy" buttons and the optional auto-copy setting).
```

**Host permission: <all_urls>**
```
In "Browser Window" and "Entire Screen" modes the user keeps working across many tabs and sites while recording (e.g. logins and OAuth redirects). To keep the on-page control bar, cursor spotlight and click ripples visible on whatever page the user navigates to or switches to during the recording, Apertur must re-inject its bundled overlay script into those pages; activeTab alone is lost on navigation. The permission is also used by chrome.tabs.captureVisibleTab for screenshots, including the multi-step full-page capture. Apertur never reads, collects, or transmits page content, browsing history, or any other user data. There is no persistent content script; scripts are only injected while recording or when the user requests a screenshot.
```

**Remote code**
```
No, I am not using remote code. All JavaScript is bundled in the extension package.
```

### Data usage (check NONE of the data types)
Apertur does not collect or transmit any of the listed user data types. Leave every box unchecked:

- [ ] Personally identifiable information
- [ ] Health information
- [ ] Financial and payment information
- [ ] Authentication information
- [ ] Personal communications
- [ ] Location
- [ ] Web history
- [ ] User activity
- [ ] Website content

Then **check all three certifications**:
- [x] I do not sell or transfer user data to third parties, outside of the approved use cases
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy policy URL
```
https://tahsinsoyak.github.io/apertur/privacy.html
```

---

## 3. Distribution tab
| Field | Value |
|---|---|
| Payments | Free of charge |
| Visibility | Public |
| Regions | All regions |

---

## 4. Submission checklist

- [ ] Developer account registered ($5 one-time) at https://chrome.google.com/webstore/devconsole
- [ ] Contact email verified in **Account** settings
- [ ] Repository is public and GitHub Pages is live (privacy URL must load: https://tahsinsoyak.github.io/apertur/privacy.html)
- [ ] `npm run package` → upload `release/apertur-v2.1.0-chrome-web-store.zip`
- [ ] Store listing: description, category, language, icon, 5 screenshots, small promo tile, marquee
- [ ] Privacy practices: single purpose, all permission justifications, data usage certifications, privacy policy URL
- [ ] Distribution: Free, Public, All regions
- [ ] Submit for review (typical review time: a few days, up to ~3 weeks for broad host permissions)
- [ ] After approval: add the Web Store link/badge to the README and landing page

> **Tip:** For every future update, bump `version` in **both** `manifest.json` and `package.json` (the package script refuses to build if they differ), then run `npm run package` and upload the new ZIP.
