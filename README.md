# FieldBase (starter)

A local desktop app for managing customers, jobs, quotes, and invoices.
This first version covers the **Customers** module — everything else
(jobs, quotes, invoicing) plugs into the same pattern.

## How it's built
- **Electron** — packages the app as a real Windows/Mac program
- **SQLite** (via `better-sqlite3`) — one local database file per install,
  stored in the OS's app-data folder, no server required
- Plain HTML/CSS/JS UI (no build step needed)

## Run it on your machine

You'll need [Node.js](https://nodejs.org) installed (v18 or later).

```bash
cd jobber-clone
npm install
npm start
```

This installs Electron and better-sqlite3, then launches the app window.

## What's in here

```
main.js            → Electron entry point, window + IPC handlers
preload.js         → Safe bridge exposing window.api to the UI
src/db.js          → SQLite schema + customer CRUD functions
renderer/          → The UI (HTML/CSS/JS)
```

## Where the data lives

Each install gets its own SQLite file, automatically created on first run,
in the standard app-data folder for the OS (e.g. `%APPDATA%/fieldbase` on
Windows, `~/Library/Application Support/fieldbase` on Mac). Nothing is sent
anywhere — it's fully local to that computer.

## Next modules to add (same pattern each time)
1. **Jobs** — new table linked to `customers` by `customer_id`, calendar view
2. **Quotes** — line items, PDF export, "convert to job" action
3. **Invoicing** — generate from a completed job, mark paid/unpaid
4. **Packaging** — `electron-builder` to produce a real `.exe`/`.dmg` installer

Ask Claude to build the next module the same way this one was built:
add a table to `src/db.js`, IPC handlers in `main.js`, expose them in
`preload.js`, and build the screen in `renderer/`.
