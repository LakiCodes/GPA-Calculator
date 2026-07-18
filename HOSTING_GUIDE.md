# Hosting Guide

This app is designed to be hosted as a static website.

## Privacy Model

Student result data is stored only in the visitor's browser using `localStorage`.

- Student A cannot see Student B's results.
- There is no shared database.
- There is no backend API.
- Grade data is not stored in cookies.
- Grade data is not sent to the hosting server by the app.

This is intentional. Cookies are sent to the server with HTTP requests, so they are not suitable for storing private GPA/result data. Browser local storage is the better fit for remembering a student's data on the same device and browser.

Important limitation: local storage is per browser and per device. If a student changes browser, changes device, clears browser data, or uses private browsing, their saved results will not automatically follow them. Cross-device syncing would require accounts, authentication, a backend database, and stronger privacy/security work.

## Build For Production

```powershell
npm run validate:curriculum
npm run test:run
npm run build
```

Upload only the generated `dist/` folder to your hosting provider.

Do not upload:

- `.tools/`
- `node_modules/`
- `reference/`
- source extraction images/text
- the Prospectus PDF

## Good Static Hosts

Any static host is fine:

- Netlify
- Vercel
- Cloudflare Pages
- GitHub Pages
- Firebase Hosting
- Any ordinary cPanel/static hosting that can serve the `dist/` folder

## Netlify

Build command:

```text
npm run build
```

Publish directory:

```text
dist
```

The `public/_headers` file adds basic browser security headers on Netlify-compatible hosts.

## Vercel

Framework preset:

```text
Vite
```

Build command:

```text
npm run build
```

Output directory:

```text
dist
```

## GitHub Pages

If hosting at a subpath such as `https://user.github.io/repo-name/`, set Vite `base` before building. For a custom domain or root deployment, no change is needed.

## Student Data

Students can export/import JSON from the app if they want a backup. The `Reset` button clears locally saved app data from the current browser.
