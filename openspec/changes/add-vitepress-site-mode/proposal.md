## Why

Users currently have no visual way to browse their learning progress, notes, and exercises outside of individual AI coding assistant interactions. The `.learn/` directory contains rich structured data (`state.json`, session notes, exercises) but no built-in viewer. Adding an optional site gives users a browsable dashboard that visualizes their learning journey, making it easy to review notes, track progress across topics, and revisit exercises — all in a fast, modern static site served locally.

## What Changes

> **Note:** The implementation pivoted from VitePress to a custom Vue 3 + Vite application. See [Design: Decision 1 — Custom Vue 3 + Vite instead of VitePress](#) for rationale.

- **New dev project**: `packages/cli/site/` — a standalone Vue 3 + Vite project for developing and debugging UI components with live HMR. Uses Vue Router for client-side routing, Tailwind CSS v4 for styling with VitePress-like design tokens.
- **New CLI command**: `learn-anything serve [path]` — one command that generates site files, installs dependencies, and starts the Vite dev server _(pending implementation)_
- **New site flag**: `learn-anything init [path] --site` and `learn-anything update [path] --site` — generates site configuration and UI components into `.learn/` without installing or starting the server _(pending implementation)_
- **New `SiteGenerator` class**: handles writing template files to `.learn/`, with smart overwrite rules (pages/config always regenerated, theme components preserved unless `--force`) _(pending implementation)_
- **Build integration**: a build-time script scans `packages/cli/site/` and generates `packages/cli/src/site/files.ts` as a `Record<string, string>` mapping embedded in the CLI binary
- **No breaking changes**: all existing `init` and `update` behavior is unchanged; site mode is purely opt-in via `--site` flag

## Architecture

The site is a **custom Vue 3 single-page application** built with:

| Layer        | Technology                                                        |
| ------------ | ----------------------------------------------------------------- |
| Framework    | Vue 3 (Composition API, `<script setup>`)                         |
| Build        | Vite with `@vitejs/plugin-vue`                                    |
| Routing      | Vue Router 4 (`createWebHistory`)                                 |
| Styling      | Tailwind CSS v4 (`@tailwindcss/vite` plugin, `@theme` tokens)     |
| Markdown     | `markdown-it` + `highlight.js`                                    |
| Data loading | `import.meta.glob` (native Vite, eager)                           |
| Dark mode    | Class-based (`.dark` on `<html>`) with `localStorage` persistence |
| i18n         | Custom composable (`useI18n`) with EN/zh-CN tables                |

### Route structure

| Path            | Component       | Description                               |
| --------------- | --------------- | ----------------------------------------- |
| `/`             | `Dashboard.vue` | Topic cards grid with progress indicators |
| `/topics/:slug` | `TopicPage.vue` | Topic detail with sidebar-driven content  |

### Component architecture

```
App.vue (holds: sidebarContext, topicSelectedFile via provide/inject)
├── AppSidebar.vue (context: 'dashboard' | 'topic')
│   ├── Dashboard context: topic list with nav links
│   └── Topic context: TOPICS/EXERCISES tabs
│       ├── Topics tab: root node → domain tree → session files
│       └── Exercises tab: concept groups → exercise files
├── <router-view>
│   ├── Dashboard.vue (route: /)
│   └── TopicPage.vue (route: /topics/:slug)
│       └── ContentViewer.vue (when file selected from sidebar)
└── LanguageSwitch.vue (in sidebar footer)
```

### Design system

The CSS design tokens and component styles are modeled on VitePress's design system:

- Typography: Inter font, heading weight 600, 3-level text colors
- Sidebar: 272px width, `bg-alt` background, underline-style tabs
- Content: `.prose-content` class matching `vp-doc.css` rules (h1: 28/32px, h2: 24px with border-top, code block negative margins on mobile, etc.)
- Colors: `--color-text-1/2/3`, `--color-bg/--color-bg-alt/--color-bg-soft`, `--color-divider/--color-border`, `--color-brand-1/2/3`

## Capabilities

### New Capabilities

- `site-theme`: Custom Vue 3 components — App.vue (route-sensing sidebar context), AppSidebar.vue (dual-tab TOPICS/EXERCISES), Dashboard.vue (topic cards), TopicPage.vue (topic detail), ContentViewer.vue (markdown/code viewer), LanguageSwitch.vue. Composables: `useI18n` (EN/zh-CN), `useTopicData` (glob-based data loading). Utilities: `markdown.ts` (markdown-it + highlight.js).
- `site-build`: Build-time script that scans `packages/cli/site/`, reads all template files, and generates `packages/cli/src/site/files.ts` as a string map for runtime use
- `site-generator` _(pending)_: Core logic for writing site files to `.learn/`, including the file registry, overwrite rules, and `.gitignore` generation
- `site-cli` _(pending)_: The `serve` command and `--site` flags on `init`/`update`, including npm install and vite dev process spawning

### Modified Capabilities

No existing capabilities are modified. This is purely additive.

## Impact

- **New dev dependencies** (dev only, in `packages/cli/site/`): `vue`, `vue-router`, `@vitejs/plugin-vue`, `@tailwindcss/vite`, `tailwindcss`, `markdown-it`, `highlight.js`, `@types/markdown-it`, `typescript`
- **New source directory**: `packages/cli/site/src/` (~12 source files: 5 components, 2 composables, 2 styles, 2 utilities, router, main.ts, App.vue)
- **New config files**: `packages/cli/site/vite.config.ts`, `packages/cli/site/tsconfig.json`, `packages/cli/site/index.html`
- **New source files** _(pending)_: `packages/cli/src/core/site-generator.ts`, `packages/cli/src/site/files.ts` (auto-generated at build time)
- **Modified files** _(pending)_: `packages/cli/src/cli/index.ts` (new `serve` command, `--site` option on `init`/`update`), `packages/cli/src/core/init.ts` (call `SiteGenerator` when `--site` is set)
- **Deleted files**: `.vitepress/` directory, `pages/` directory, VitePress-specific components (TopicCard, DomainPage, SessionNotes, ExerciseView, ProgressBar, StatusIcon, Layout)
- **No changes to**: existing learn-protocol types/schemas, skill/command templates, rendering scripts, i18n locale files

## Remaining Work

The dev project (`packages/cli/site/`) is fully functional with `vite dev` and `vite build`. The following are pending implementation:

1. **`SiteGenerator` class** — Write site files from embedded `SITE_FILES` mapping to `.learn/`
2. **CLI `serve` command** — Generate files + npm install + vite dev
3. **CLI `--site` flag on `init`/`update`** — Call SiteGenerator after skill generation
