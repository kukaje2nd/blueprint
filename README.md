# Blueprint

Blueprint is a personal operating system for deliberate self-improvement: planning goals, running experiments, tracking custom metrics, composing realistic weeks, reflecting on evidence, and learning what actually works for you.

## Current product

This repository begins from the consolidated **Blueprint v22** prototype.

## Quick Catch

Blueprint now separates **capture** from **organization**. The global Catch button and `C` shortcut open a one-field Quick Catch surface. Captured thoughts enter Life Guide **Unsorted** as raw ideas/questions/possibilities without deadlines, scores, or task semantics. The user can later move them to Now / Keep warm / Later or open them for more detail.

The previous Reflect Inbox is reframed as **Loose ends** for pinned follow-ups and generated reminders, so raw personal ideas have one clear home.

## Learning Review

Reflect is now an **as-needed learning surface**, not a weekly compliance ritual. It surfaces real workspace evidence—recent Day Designs, experiment observations, saved Week Design context, and Loose ends—without inventing a queue for fresh workspaces. Four optional lenses help the user notice what mattered, compare design with reality, interpret evidence carefully, and carry one useful thing forward.

The existing Keep / Change / Explore weekly snapshot remains compatible, but the interface treats it as a learning note rather than a scorecard. Existing review-state and synthesis data are preserved.

## Life Guide

Plan is now a **Life Guide**: a flexible place to keep ideas, directions, commitments, questions, and possibilities visible without forcing them into tasks. Guide items live in **Now / Keep warm / Later** and can remain loose indefinitely. When useful, the user can explicitly bring an item into Day Design or Week Design, make it a Goal, or create a Rhythm.

The Guide is deliberately non-scoring and non-urgent. Blueprint may surface gentle structural suggestions (for example, when Now becomes crowded), but does not automatically convert important things into productivity objects.

## Week Design

The weekly planning surface is now **Week Design**. A week can carry a posture (Build, Maintain, Recover, Connect, Explore, or Mixed), 1–3 success conditions, visible fixed reality, helpful rhythms, a deliberate boundary, a trade-off rule, a minimum viable week, and an optional light day. Protected-time capacity remains available as a guardrail rather than the definition of success.

Existing weekly drafts and committed calendar blocks continue to use the same storage model; the new fields extend that model without destructive migration.

## Rhythms & Choices

Recurring structure is modeled as **rhythms**, not streaks. A rhythm has a purpose, cadence, preferred window, minimum version, and flexibility policy (protect, move freely, or optional). Personal **choice rules** use a When → Choose pattern to reduce repeated decisions. Both can be pulled into Day Design as supports without creating completion history.

Rhythms live under Plan rather than Lab because they shape life architecture; Lab remains for bounded experiments and evidence.

## Day Design

Blueprint's daily surface is a design tool rather than an activity tracker. A day can have an intent, a few success conditions, fixed anchors, supports, boundaries, a choice rule, and a minimum viable version. Calendar blocks are shown as structure rather than completion checkboxes, and habits can be used as supports without streak pressure.

The product loop is moving toward **Design → Live → Adapt → Learn** rather than daily scoring.

## Progressive activation

New workspaces start in **Start simple** mode. Blueprint keeps the full five-space architecture, but reduces navigation and hides advanced surfaces until they are useful. The first-week loop is: choose one direction → shape the week → capture one observation → let repeated evidence earn reflection. Lab and Reflect unlock from evidence, and the user can reveal Full Blueprint at any time.

Fresh workspaces no longer inherit demo goals, experiments, metrics, memories, decisions, relationships, or inbox items. Existing persisted workspace data is preserved.

Primary spaces:

1. **Today** — Day Design, fixed anchors, current attention, and adaptive guidance.
2. **Plan** — Life Guide, Goals, Week Design, Rhythms & Choices, Calendar, projects, and longer horizons.
3. **Lab** — experiments, custom metrics, protocols, and impact loops.
4. **Reflect** — Learning Review, Memory, decisions, Loose ends, and long-term evidence.
5. **You** — personalization, identity, relationships, data vault, connections, and sync controls.

## Architecture today

The current application is intentionally dependency-light:

- a static app shell in `index.html`
- shared design system in `assets/styles.css`
- application behavior split across focused modules for core app behavior, Day Design, Week Design, Life Guide, Rhythms, activation, Today, Plan, and attention/connections
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

The first monolith split is complete. The next engineering phase is to continue toward a maintainable application structure while preserving behavior:

- componentized frontend and route-level modules
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
