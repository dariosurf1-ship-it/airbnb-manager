# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**Airbnb Manager** — a React + Vite single-page PWA for managing short-let
apartments (bookings, calendar, door codes, cleaning/ops, guest access).
Backend is **Supabase** (auth + Postgres). The UI language is **Italian**;
keep user-facing strings in Italian, and match the existing informal tone.

## Commands

| Task | Command |
| --- | --- |
| Install deps | `npm install` |
| Dev server | `npm run dev` (127.0.0.1:5173, `strictPort`) |
| Production build | `npm run build` |
| Preview a build | `npm run preview` |
| Lint | `npm run lint` |

There is **no test framework** in this project — no test runner, no test
script, no test files. `npm run build` plus `npm run lint` are the only
automated checks. Don't claim tests pass; say the build passes.

### Lint baseline

`npm run lint` is **not clean on `main`**: it reports 8 errors and 2 warnings
that predate any current work (unused `catch` bindings in `lib/cloud.js` and
`Dashboard.jsx`, empty blocks in `lib/storage.js`, `react-refresh/only-export-components`
in `CloudProvider.jsx` and `PropertyContext.jsx`, an unused `onSaved` in
`Prenotazioni.jsx`). Compare against this baseline before blaming a change —
and don't "fix" them as a drive-by unless asked.

## Architecture

Entry: `src/main.jsx` → `BrowserRouter` → `CloudProvider` → `App`.

- **`src/CloudProvider.jsx`** is the heart of the app. It owns the Supabase
  session, the property list, the selected property, and the caller's role.
  Everything reads it through the `useCloud()` hook. Read this file first.
- **`src/App.jsx`** gates on provider state in order: loading → no session
  (login) → no properties → no selection. Routes render inside
  `PropertyLayout`, keyed by `selectedId` so switching apartments **remounts
  the whole subtree** (deliberate — it avoids stale/empty pages).
- **`src/layouts/PropertyLayout.jsx`** — app shell: `Sidebar` + `Topbar` + `Outlet`.
- **`src/pages/*.jsx`** — one file per route: Dashboard, Prenotazioni,
  Calendario, Codici, Operativita, Profilo, Accessi, Condivisione, Login.

### Selected-property flow

The selected apartment is tracked in **three places kept in sync** by
`CloudProvider`: React state, the `?property=<id>` URL search param, and
`localStorage`. Precedence on load is **URL → localStorage → first property**.
When you touch selection logic, keep all three in sync or the app will render
a different apartment than the URL says.

## Known inconsistencies (real, verified — don't "clean up" casually)

These are live traps. Read before editing the data layer.

1. **Two role tables.** `CloudProvider.jsx` queries `property_members`, while
   `lib/cloud.js#fetchMyRoleForProperty` queries `memberships` (and also checks
   `app_admins` and `properties.owner_id`). At most one of these table names is
   right. Confirm against the actual Supabase schema before relying on either.
2. **Two booking data layers.** `lib/data.js` and `lib/cloud.js` both export
   `fetchBookings` / `createBooking` / `updateBooking` with **different row
   shapes**. Pages use `lib/data.js`; `Accessi.jsx` and `Login.jsx` use
   `lib/cloud.js`. Prefer `lib/data.js` for booking work.
3. **Dual booking column names.** The `bookings` table is written with both
   `guest`/`guest_name` and `check_in`/`start_date` + `check_out`/`end_date`.
   `lib/data.js#normBookingRow` normalizes on read and its writers set both
   sides. Preserve that dual-write or rows become invisible to one code path.
4. **Two property-selection localStorage keys.** `lib/propertySelection.js`
   (`airbnb_selected_property_id_v1`, the live one, used by `CloudProvider`)
   and `lib/storage.js` (`airbnb_manager_selected_property_v1`, legacy).
5. **`lib/storage.js` is the pre-Supabase localStorage layer.** Only
   `pages/Codici.jsx` still imports it; that page is therefore still partly
   local-only. New features should go through Supabase.

## Dead code (imported by nothing — verified)

`src/lib/auth.js` (legacy localStorage auth with hardcoded demo credentials —
superseded by Supabase auth; do not revive it), `src/lib/date.js`,
`src/lib/useSelectedProperty.js`, `src/context/PropertyContext.jsx`.
`vite-plugin-pwa` is a dependency but is **not** wired into `vite.config.js`;
the PWA manifest is hand-written at `public/manifest.webmanifest` and linked
from `index.html`.

## Configuration

Vite env vars, read in `src/supabaseClient.js`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Both are `VITE_`-prefixed, so they are **embedded in the client bundle and are
public by design** — the anon key is meant to be shipped to browsers, and row
level security in Supabase is what actually protects the data. Note that `.env`
is currently committed to the repository. Never add a service-role key, or any
genuine secret, to `.env` or to any `VITE_` variable.

## Conventions

- Plain **JavaScript + JSX**, ES modules, no TypeScript.
- React 19, function components and hooks only.
- Styling is hand-written CSS, no framework: global `src/styles/theme.css` and
  `src/styles/layout.css` (imported once in `main.jsx`), plus per-component
  files (`Sidebar.css`, `Topbar.css`, `BookingModal.css`, `Calendario.css`).
  Utility class names like `card`, `glass`, `muted`, `h1`/`h2`, `page` come
  from `theme.css` — reuse them instead of adding new one-off styles.
- Icons: `lucide-react`. Calendar: `@fullcalendar/react` + `daygrid`.
- Supabase errors are generally logged with `console.warn` and degraded
  gracefully rather than thrown to the user — follow that pattern so a missing
  table never white-screens the app.
- Existing comments are in Italian; that's fine, keep them consistent locally.
