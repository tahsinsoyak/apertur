# Privacy Policy — Apertur

**Effective date:** November 10, 2026
**Applies to:** the Apertur Chrome extension (all versions) and the website at https://tahsinsoyak.github.io/apertur/

Apertur is built around one simple rule: **your recordings never leave your computer.**

## Summary

| Question | Answer |
|---|---|
| Does Apertur collect personal data? | **No.** |
| Does Apertur upload recordings or screenshots? | **No.** Everything is stored locally in your browser. |
| Does Apertur use analytics, tracking, or ads? | **No.** |
| Does Apertur sell or share data with third parties? | **No.** There is no data to sell or share. |
| Does Apertur require an account? | **No.** |

## What the extension stores — and where

All data is stored **only on your device**, inside your own Chrome profile:

| Data | Storage location | Purpose |
|---|---|---|
| Video recordings (WebM) | IndexedDB (local to the extension) | So you can preview, trim, rename, and download them in the Media Library |
| Screenshots (PNG) | IndexedDB (local to the extension) | So you can view, annotate, copy, and download them |
| Preferences (resolution, FPS, cursor theme, toggles) | `chrome.storage.local` | To remember your settings between sessions |
| Temporary recording state (is recording, start time) | `chrome.storage.local` | To keep the recording timer and badge correct |

You can delete any recording or screenshot from the Media Library at any time. Uninstalling the extension permanently deletes all of the above.

## Microphone, screen, and tab audio

- Screen, window, and tab capture only starts **after you click Record** and choose what to share in Chrome's own picker.
- The microphone is only accessed if **you enable "Include Microphone"**. Audio is mixed into your local recording and is never transmitted.
- Chrome shows its own "sharing" indicator for the full duration of any capture.

## Website content and permissions

Apertur requests access to web pages (`<all_urls>`) **only** to:

- draw the cursor spotlight, click ripples, and floating recording controls on the page you are recording, and
- capture screenshots (visible area, selected area, or full scrolling page) when you ask for one.

Apertur does **not** read, collect, store, or transmit the content of the web pages you visit, your browsing history, form inputs, passwords, or cookies.

## Network requests

The extension makes **no network requests** to any server. It contains no remote code, analytics SDKs, crash reporters, or ad networks. Links to GitHub, Patreon, or the project website open only when you click them.

The project website (GitHub Pages) is a static site. GitHub may process standard server logs (such as IP addresses) as described in the [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

## Children's privacy

Apertur does not knowingly collect any information from anyone, including children under 13.

## Chrome Web Store User Data Policy

The use of information received from Chrome APIs adheres to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), including the Limited Use requirements. Because Apertur does not collect or transmit user data, no user data is used for advertising, sold, or transferred to third parties.

## Changes to this policy

If this policy ever changes, the updated version will be published in this repository and on the project website, with a new effective date. Any change that would involve collecting data would require a new, explicit opt-in.

## Contact

Questions about privacy? Open an issue at https://github.com/tahsinsoyak/apertur/issues or email **tahsinsoyakk@gmail.com**.
