> **Architectural note:** The implementation pivoted from VitePress to a custom Vue 3 + Vite application. The dev project at `packages/cli/site/` is now a standalone Vue 3 app with Vue Router, Tailwind CSS v4, markdown-it, and highlight.js — no VitePress dependency. This affects how tasks 1-9 were implemented (different file structure, different components) but the high-level goals remain the same.

## 1. Build script for site file bundling

- [x] 1.1 Create `packages/cli/scripts/bundle-site.mjs` — Node.js ESM script that scans `packages/cli/site/`, reads all files (excluding `node_modules/`, `topics/`, `dist/`, `package-lock.json`, `pnpm-lock.yaml`), and generates `packages/cli/src/site/files.ts` as `export const SITE_FILES: Record<string, string> = {...}`
- [x] 1.2 Handle TypeScript string escaping in generated output — properly escape backticks, `${` template literals, backslashes, and other special characters in file content
- [x] 1.3 Integrate `bundle-site.mjs` into `packages/cli/package.json` build script — runs before `tsc` compilation via `"build": "node scripts/bundle-site.mjs && tsc"`, plus separate `"site:bundle"` script
- [x] 1.4 Unit test `bundle-site.mjs` — verify all expected files are included, excluded paths are absent, string escaping is correct (23 tests in `test/bundle-site.test.ts`)

## 2. Vue 3 + Vite dev project scaffold

> **Pivot from VitePress:** The original VitePress scaffold was replaced with a custom Vue 3 + Vite setup.

- [x] 2.1 Create `packages/cli/site/package.json` with `vue ^3.5`, `vue-router ^4`, `@vitejs/plugin-vue`, `@tailwindcss/vite`, `tailwindcss`, `markdown-it`, `highlight.js`, `typescript` dependencies
- [x] 2.2 Create `packages/cli/site/.gitignore` with `node_modules`, `dist`
- [x] 2.3 Create `packages/cli/site/vite.config.ts` — Vue + Tailwind CSS v4 plugins, `@data` alias, `server.host: true` for LAN access
- [x] 2.4 Create `packages/cli/site/tsconfig.json` + `packages/cli/site/env.d.ts` — TypeScript configuration for Vue SFCs
- [x] 2.5 Create `packages/cli/site/index.html` — SPA entry point with Inter font (Google Fonts), `<div id="app">` mount
- [x] 2.6 Create `packages/cli/site/src/styles/main.css` — Tailwind v4 `@import "tailwindcss"`, `@theme` block with VitePress-matching design tokens, `.prose-content` class matching VitePress `vp-doc.css`, dark mode variant

## 3. Routing and app shell

> **Pivot from VitePress:** Replaced file-based routes (`pages/*.md` + `.paths.js`) with Vue Router.

- [x] 3.1 Create `packages/cli/site/src/main.ts` — `createApp(App).use(router).mount('#app')`
- [x] 3.2 Create `packages/cli/site/src/router/index.ts` — Vue Router with 2 routes: `/` (Dashboard) and `/topics/:slug` (TopicPage), lazy-loaded components, `createWebHistory` base
- [x] 3.3 Create `packages/cli/site/src/App.vue` — root component with route-sensing sidebar context (`dashboard` vs `topic`), `provide('topicSelectedFile')` for sidebar→TopicPage communication, dark mode initialization, `lg:pl-[272px]` main content offset

## 4. Composables

> **Pivot from VitePress:** Composables moved from `.vitepress/theme/composables/` to `src/composables/`. Data loading uses `import.meta.glob` (native Vite) instead of VitePress `.paths.js` + `@data` alias.

- [x] 4.1 Create `packages/cli/site/src/composables/useI18n.ts` — singleton reactive locale from localStorage, `t(key)` with full EN/zh-CN message tables (sidebar tabs, theme switch, dashboard, topic/domain/concept labels), `toggleLocale()`, `isDark` + `toggleDarkMode()`
- [x] 4.2 Create `packages/cli/site/src/composables/useTopicData.ts` — uses Vite `import.meta.glob` (eager) for build-time file resolution. `listAllTopics()` scans `/topics/*/state.json`, `loadTopic(slug)` looks up from glob map, `scanSessions(slug, domain)` filters `/topics/*/sessions/*/*.md`, `scanExercises(slug)` groups `/topics/*/exercises/**/*` by concept slug, `loadExerciseContent(path)`, `loadKnowledgeMap(slug)`

## 5. Vue components — Dashboard

> **Pivot:** Original TopicCard, ProgressBar, StatusIcon components were removed. Dashboard now renders cards inline with VitePress-style design (bg-soft, divider border, brand-2 hover, thin progress bars).

- [x] 5.1 Create `Dashboard.vue` — calls `listAllTopics()`, renders topic cards grid (1-col mobile, 2-col desktop), empty state with message, page heading in VitePress h1 style. Each card: topic name, domain/concept/mastered stats, thin progress bar with percentage, click navigates via `router.push()`
- [x] 5.2 ~~TopicCard.vue~~ — Deleted. Card UI is inlined in Dashboard.vue since there's only one card variant.
- [x] 5.3 ~~ProgressBar.vue~~ — Deleted. Progress bar is inlined in Dashboard.vue as a simple div with dynamic width.
- [x] 5.4 ~~StatusIcon.vue~~ — Deleted. Concept status is shown via text labels in TopicPage.

## 6. Vue components — AppSidebar

> **Pivot:** This is a new component replacing the combination of VitePress sidebar + DomainPage navigation. It handles both dashboard context (topic list) and topic context (TOPICS/EXERCISES tabs with file trees).

- [x] 6.1 Create `AppSidebar.vue` — 272px fixed sidebar, dual context via `context` prop:
  - **Dashboard context**: Topic list with name + mastery stats, click navigates to topic
  - **Topic context**: TOPICS/EXERCISES tab bar (underline active style), root node (topic name, click returns to knowledge map), domain tree with expand/collapse, session file list, exercise concept groups with expand/collapse
  - Mobile hamburger menu with overlay
  - Footer with LanguageSwitch + dark mode toggle
  - Emits: `file-selected`, `topic-selected`, `back-to-dashboard`

## 7. Vue components — TopicPage and ContentViewer

> **Pivot:** TopicPage is simpler than the original VitePress version. It uses `inject('topicSelectedFile')` to receive file selection from sidebar, with a default view showing the knowledge map. ContentViewer is a new component for pure content rendering.

- [x] 7.1 Create `TopicPage.vue` — receives `slug` prop, default view: h1 title + `.prose-content` rendering `knowledge-map.md`. When file selected via inject: renders `<ContentViewer>` with the file. No card wrapper — content flows naturally.
- [x] 7.2 Create `ContentViewer.vue` — receives `SelectedFile` (path, content, type). Markdown: renders into `.prose-content` div. Code: shows filename label + syntax-highlighted pre/code block. Empty state: "Select a file" message.
- [x] 7.3 ~~DomainPage.vue~~ — Deleted. Domain navigation moved into AppSidebar's TOPICS tab, content rendering moved to ContentViewer.
- [x] 7.4 ~~SessionNotes.vue~~ — Deleted. Session file list moved to AppSidebar, content rendering moved to ContentViewer.
- [x] 7.5 ~~ExerciseView.vue~~ — Deleted. Exercise file list moved to AppSidebar's EXERCISES tab, content rendering moved to ContentViewer.

## 8. Language switch component

> **Pivot:** LanguageSwitch is now a plain text button in the sidebar footer instead of a VitePress navbar slot. No Layout.vue needed.

- [x] 8.1 Create `LanguageSwitch.vue` — plain text button using `useI18n()`, shows opposite language label, `text-xs font-medium` with hover color transition
- [x] 8.2 ~~Layout.vue~~ — Deleted. Not needed without VitePress theme extension.

## 9. Dev fixtures for testing the site locally

- [x] 9.1 Copy sample `state.json` and `knowledge-map.md` to `packages/cli/site/topics/javascript/`
- [x] 9.2 Create sample session note files in `packages/cli/site/topics/javascript/sessions/language-basics/` (2 files) and `functions-scope/` (1 file)
- [x] 9.3 Create sample exercise files in `packages/cli/site/topics/javascript/exercises/variables-data-types/` — README.md, starter.js, solution.js, practice-2026-06-14.json
- [x] 9.4 Verify `pnpm -F learn-anything-cli build` succeeds (vite build → bundle-site → tsc, all pass). All 219 tests pass.

## 10. SiteGenerator class

> **Status: Pending.** This was designed for VitePress but the concept is the same for Vue 3 + Vite — write embedded template files to `.learn/`.

- [x] 10.1 Create `packages/cli/src/core/site-generator.ts` — `SiteGenerator` class that imports `SITE_FILES` from `../site/files.ts`, iterates entries, writes each to `.learn/<path>`. Implements overwrite rules: component/composable/style files skipped if exist (unless `force`), config files always written. Creates parent directories as needed
- [x] 10.2 Implement `.gitignore` generation — always writes `.learn/.gitignore` with `node_modules/`, `dist/`
- [x] 10.3 Export `SiteGenerator` from `packages/cli/src/index.ts` (public API)
- [x] 10.4 Unit test `SiteGenerator` — verify correct file writing, overwrite rules, .gitignore content, force mode

## 11. CLI integration — serve command

> **Status: Complete.** serve command, --site flag, --force propagation, i18n messages, edge case handling, and integration tests all done.

- [x] 11.1 Add `serve [path]` command to `packages/cli/src/cli/index.ts` using Commander. Options: `--port <number>`, `--no-open`, `--force`
- [x] 11.2 Implement serve flow: resolve path → ensure `.learn/` and `.learn/topics/` exist → call `SiteGenerator.generate()` → run `npm install --prefix .learn` (with spinner/feedback) → spawn `npx --prefix .learn vite .learn` with optional `--port` and `--open` flags → forward SIGINT/SIGTERM to child process
- [x] 11.3 Add `--site` flag to `init [path]` command — after existing skill/command generation completes, call `SiteGenerator.generate()` without npm install or serve
- [x] 11.4 Add `--site` flag to `update [path]` command — after existing update logic completes, call `SiteGenerator.generate()` (which will overwrite config but preserve theme)
- [x] 11.5 Add `--force` flag propagation: `init --site --force` and `serve --force` pass `force: true` to `SiteGenerator` to overwrite theme files
- [x] 11.6 Add localized CLI messages for serve-related output in `packages/cli/src/i18n/locales/en.ts` and `zh-CN.ts`: "generating site files...", "installing dependencies...", "starting dev server...", "site ready at {url}"
- [x] 11.7 Handle edge cases: npm not installed, dependency install failure, port already in use, missing `.learn/` directory, empty topics directory
- [x] 11.8 Integration test for `serve` command — verify it generates files, runs npm install, attempts to start vite
- [x] 11.9 Integration test for `init --site` — verify site files are generated alongside skill/command files
- [x] 11.10 Integration test for `update --site` — verify config files are overwritten but theme files are preserved
- [x] 11.11 Verify existing tests still pass — `init` without `--site` should behave identically to before
