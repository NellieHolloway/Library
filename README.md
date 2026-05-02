# The Library

A reading tracker as a Progressive Web App. Track books, manga, light novels,
and visual novels with daily session logging, OpenLibrary / AniList / VNDB
lookup, and durable local storage. Installs as a real app, works offline.

## Files

| File                          | What it is                                       |
|-------------------------------|--------------------------------------------------|
| `index.html`                  | The app itself                                   |
| `manifest.webmanifest`        | PWA manifest — name, icons, display mode         |
| `sw.js`                       | Service worker — offline caching                 |
| `icon-192.png`                | Standard icon                                    |
| `icon-512.png`                | High-res icon                                    |
| `icon-maskable-512.png`       | Maskable icon (Android adaptive icons)           |
| `apple-touch-icon.png`        | iOS home-screen icon                             |
| `favicon.ico`                 | Browser tab icon (multi-size)                    |

All eight files live in the same folder; relative paths are baked in.
The README itself isn't part of the app.

## Deploy

The app **must** be served over `http://` or `https://`. Service workers do
not run from `file://`, so opening `index.html` directly will work as a
plain web app but will **not** install or work offline.

### Recommended: GitHub Pages (matches Vinyl Vault setup)

1. In your existing GitHub Pages repo, create a folder e.g. `library/`.
2. Drop all eight files into that folder. Commit and push.
3. Visit `https://<your-username>.github.io/<repo>/library/`.
   GitHub Pages serves `index.html` automatically.
4. Chrome / Edge / Brave: an install icon appears in the address bar.
   Safari iOS: tap Share → Add to Home Screen.

### Local development

```bash
cd library/
python3 -m http.server 8000
```

Then visit `http://localhost:8000/`. The install banner will appear.
Some browsers require HTTPS for `beforeinstallprompt`; `localhost` is
treated as secure, so this works.

## Once installed

- Lives in your dock / Start menu / home screen with the L icon.
- Runs in its own window — no browser chrome.
- App shortcuts: right-click the dock icon for "Log a session" or
  "Add a book" as direct entry points.
- Works fully offline. Cover images you've already viewed remain
  visible; the search APIs require connectivity.
- When a new version is deployed, you'll see a small "Reload"
  toast inviting you to update.

## Data

All data lives in `localStorage` under the key `library.v1`. To move
between browsers or devices, use **Export JSON** (menu → ⋯).

The app uses the File System Access API where available
(Chrome / Edge / Opera), so Export prompts you to choose a real
save location instead of dropping files in `Downloads`.
Safari and Firefox fall back to the standard download flow.

## Updating

To ship a new version after editing `index.html`:

1. Bump `VERSION` in `sw.js` (e.g. `'v1.0.0'` → `'v1.0.1'`).
2. Commit & push.

Existing installs will detect the update on next open and surface the
"Reload" toast. One click swaps in the new version.

## Privacy

The app makes outbound requests only to:

- `openlibrary.org` and `covers.openlibrary.org` (book search & covers)
- `graphql.anilist.co` and `s4.anilist.co` (manga / LN search & covers)
- `api.vndb.org` and `s2.vndb.org` (visual novel search & covers)
- `fonts.googleapis.com` and `fonts.gstatic.com` (typography)
- `corsproxy.io` (only as a fallback when direct calls are blocked)

No analytics, no tracking, no account, no server. Your data stays in
your browser.
