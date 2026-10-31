# PHIMS — Design Prototype

This is a front-end-only, presentation prototype of PHIMS (Pakistan Health
Information Management System). It is **not** connected to the Phase 2A
backend built earlier — it has no server, no database, and no real
authentication. It exists to show stakeholders what the product looks and
feels like before investing in the full build.

## What's real vs. simulated

- **Real:** every screen, every piece of navigation, dark/light mode,
  responsive layout down to phone width, charts and the map drawn live
  from the demo dataset, filtering and search, role-based sidebar and
  scope changes.
- **Simulated:** sign-in (one shared demo password, checked in the
  browser), MFA (any role marked "MFA required" asks for the code
  `123456`), all data (synthetic — see `js/data.js`), every write action
  (inviting a user, approving an alert, recording a transfer). These
  change only the current browser tab's memory and reset on reload.

## Running it

No build step and no server-side code — it's plain HTML/CSS/JS. Open
`index.html` directly in a browser, or serve the folder with any static
file server, for example:

```bash
cd phims-prototype
python3 -m http.server 8080
# then open http://localhost:8080
```

## Signing in

Pick any role from the dropdown on the sign-in page — it fills in the
matching email. The password for every demo account is:

```
PhimsDemo#2026
```

Roles marked as requiring MFA will then ask for a 6-digit code — use
`123456`.

Each role changes what the sidebar shows and what data is visible,
dramatizing the jurisdiction scoping from the Phase 1 role-permission
matrix (for example, a District Health Officer only sees Narowal
district's facilities and cases; a National Health Administrator sees
all of Punjab and beyond).

## Structure

```
index.html        Sign-in
signup.html        Request-access page (no self-registration, per spec)
app.html            The authenticated app shell (nav rail + topbar + router)
css/styles.css      All styling: tokens, glassmorphism surfaces, light/dark themes
js/data.js          Synthetic demo dataset (facilities, cases, inventory, alerts, users, audit)
js/theme.js         Dark/light mode toggle, persisted in localStorage
js/auth.js          Demo-only session handling (sessionStorage, no network)
js/icons.js         Inline SVG icon set
js/charts.js        Hand-rolled inline SVG charts (line, donut, bar, map) — no chart library
js/views.js         Page renderers: dashboard, facilities, patients, surveillance,
                    inventory, equipment, imports, alerts, reports, users, audit, settings
js/app.js           App shell controller: routing, nav, topbar, modals, toasts
js/login.js         Sign-in page logic
js/signup.js        Request-access page logic
```

## Design notes

- **Glassmorphism:** translucent, blurred surfaces (`backdrop-filter`)
  used throughout — the nav rail, topbar, cards, tables, and modals. Blur
  and opacity are tuned by surface role: the nav rail and auth hero use a
  deeper blur, while data tables use a lighter one so dense numbers stay
  legible.
- **Dark / light mode:** toggle in the top bar (and in Settings). Falls
  back to the system preference if the person hasn't chosen one, and the
  choice persists across reloads via `localStorage`.
- **No external chart or icon libraries** — charts and icons are
  hand-written inline SVG, so the prototype has zero network
  dependencies except for the Google Fonts stylesheet (Sora / IBM Plex).
  If opened fully offline, it still works — it just falls back to the
  system font.
