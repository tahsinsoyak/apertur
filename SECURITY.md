# Security Policy

## Supported versions

Only the latest released version of Apertur (Chrome Web Store / latest GitHub Release) receives security fixes.

## Reporting a vulnerability

Please report security issues **privately**. Do not open a public issue.

- Preferred: [GitHub private vulnerability reporting](https://github.com/tahsinsoyak/apertur/security/advisories/new)
- Or email: **tahsinsoyakk@gmail.com** with the subject `[Apertur Security]`

Please include:

- A description of the issue and its impact
- Steps to reproduce (a proof-of-concept page or script, if possible)
- Affected version and Chrome version

You can expect an acknowledgement within **72 hours**. Confirmed issues will be fixed as quickly as possible and credited in the release notes (unless you prefer to stay anonymous).

## Scope

Examples of in-scope issues:

- A web page being able to trigger recording, read recordings, or access the extension's IndexedDB
- Cross-site scripting in extension pages (popup, preview, library)
- Messages from web pages being accepted by the extension's service worker or content script
- Any path where recordings, screenshots, or page data could leave the user's device
