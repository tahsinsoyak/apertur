# Contributing to Apertur

Thanks for your interest in improving Apertur! Bug reports, feature ideas, docs fixes, and pull requests are all welcome.

## Ground rules

- Be kind and respectful. See the [Code of Conduct](CODE_OF_CONDUCT.md).
- **Privacy first.** Apertur never sends user data anywhere. PRs that add analytics, tracking, remote code, or network calls that send recordings or page content off the device will not be accepted.
- **No new permissions without a reason.** Any change to `permissions` / `host_permissions` in `manifest.json` must explain why in the PR, because it affects Chrome Web Store review and user trust.

## Project structure

```
background/   Service worker: recording state, commands, script injection
content/      On-page overlay: cursor spotlight, HUD, area snip, full-page capture
offscreen/    Offscreen document hosting MediaRecorder (MV3 requirement)
popup/        Toolbar popup UI
preview/      Video player, trimmer, screenshot annotation, media library
utils/db.js   IndexedDB wrapper (local storage of recordings & screenshots)
landing/      Website + privacy policy (also bundled into the extension)
scripts/      Build, packaging, store assets, and Playwright test scripts
```

## Development setup

```bash
git clone https://github.com/tahsinsoyak/apertur.git
cd apertur
npm install                      # only needed for Playwright scripts/tests
npx playwright install chromium  # only needed for Playwright scripts/tests
npm run build                    # copies the extension into dist/
```

Load it in Chrome:

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` folder (or the repo root while developing)
4. After code changes, click the reload ↻ icon on the extension card

## Useful scripts

| Command | What it does |
|---|---|
| `npm run build` | Builds the extension into `dist/` and syncs GitHub Pages files |
| `npm run package` | Builds and zips `dist/` into `release/` for the Chrome Web Store |
| `npm run store:assets` | Regenerates store screenshots and promo tiles |
| `node scripts/verify-all.js` | Popup and gallery checks (Playwright) |
| `node scripts/test-live-e2e.js` | Live end-to-end browser tests (Playwright) |

## Making a pull request

1. Fork the repo and create a branch: `git checkout -b fix/short-description`
2. Keep changes focused. One feature or fix per PR.
3. Test manually in Chrome (all three recording modes if you touched recording code).
4. Use clear commit messages, e.g. `fix(popup): ...`, `feat(preview): ...`, `docs: ...`
5. Open the PR and fill in the template.

## Reporting bugs

Use the **Bug report** issue template and include your OS, Chrome version, recording mode, and any errors from `chrome://extensions` → Apertur → *Errors* / *Inspect views: service worker*.

## Security issues

Please **do not** open public issues for security vulnerabilities. See [SECURITY.md](SECURITY.md).
