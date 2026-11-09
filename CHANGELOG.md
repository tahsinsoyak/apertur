# Changelog

All notable changes to Apertur are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Chrome Web Store readiness
- **Privacy:** added a privacy policy ([PRIVACY.md](PRIVACY.md) and `privacy.html` on the website), linked from the landing and sponsor page footers.
- **Permissions:** removed the always-on content script that ran on every website. Overlays (cursor spotlight, HUD, countdown, snip, full-page capture) are now injected only when they're needed.
- **Permissions:** removed the unused `tabs` and `desktopCapture` permissions.
- **Manifest:** added `short_name`, `homepage_url`, `minimum_chrome_version` (116), and an action tooltip.
- **Store assets:** added 1280×800 screenshots, a 440×280 small promo tile, and a 1400×560 marquee (`npm run store:assets`).
- **Packaging:** added `npm run package`, which builds a store-ready ZIP in `release/`, checks that the manifest and package versions match, and checks the description length.
- **Open source:** added CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, issue/PR templates, and CI/release workflows. Removed hardcoded local paths from scripts.

## [2.1.0]

### Added
- Annotation Studio for screenshots (pen, arrows, boxes, highlighter, text)
- Microphone gain boost (50%–200%) with live level meter
- Responsive navbar overhaul and SEO improvements for the website

## [2.0.0]

### Added
- Three recording modes: Browser Window, Entire Screen, This Tab Only
- 1080p 60 FPS VP9 recording, cursor spotlight and click ripples
- Built-in video trimmer, export presets, and local media library
- Visible, area, and full-page screenshots with keyboard shortcuts
