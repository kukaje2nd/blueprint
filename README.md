# Blueprint

Blueprint is a personal operating system for deliberate self-improvement: planning goals, running experiments, tracking custom metrics, composing realistic weeks, reflecting on evidence, and learning what actually works for you.

## Current product

This repository begins from the consolidated **Blueprint v22** prototype.

Primary spaces:

1. **Today** — current attention, schedule, weekly promise, daily pulse, and adaptive brief.
2. **Plan** — goals, projects, calendar, routines, roadmap, weekly composer, and starter architectures.
3. **Lab** — experiments, custom metrics, protocols, and impact loops.
4. **Reflect** — weekly reviews, Weekprints, memory, decisions, and long-term evidence.
5. **You** — personalization, identity, relationships, data vault, connections, and sync controls.

## Architecture today

The current application is intentionally dependency-light:

- static HTML / CSS / JavaScript
- browser-local persistence
- local account prototype and per-account namespaces
- export/import data vault
- local-first sync architecture and revision journal
- standard iCalendar import/export

The repository is now the source of truth. Future product updates should be committed here rather than shipped as numbered standalone artifacts.

## Run locally

No build step is required for the current prototype.

Open `index.html` directly, or serve the repository with any static HTTP server.

Example:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Validate

Requires Node.js 18+.

```bash
npm run validate
```

The validator checks that the production HTML exists, inline JavaScript parses, DOM IDs are unique, and primary navigation targets are present.

## Deploy

The repository is prepared for Vercel as a static site.

Once the Vercel workspace is connected:

1. Import this GitHub repository.
2. Use the repository root as the project root.
3. Framework preset: **Other** / static.
4. No build command is required.
5. Output directory: repository root.

Every branch can then receive a Vercel preview deployment, while `main` can serve production.

## Near-term migration

The next engineering phase is to move from the single-file prototype to a maintainable application structure while preserving behavior:

- componentized frontend
- production authentication
- database-backed per-user workspaces
- cross-device sync
- server-backed reminders/integrations
- automated preview validation

Cloud architecture notes already developed in the prototype should be carried forward rather than replaced with silent last-write-wins synchronization.

## Product principle

Blueprint should help people answer four questions:

1. What am I trying to change?
2. What am I going to try?
3. What actually happened?
4. What does that teach me about myself?
