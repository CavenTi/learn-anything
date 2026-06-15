## 1. Build script for site file bundling

- [ ] 1.1 Create `packages/cli/scripts/bundle-site.ts` — Node.js script that scans `packages/cli/site/`, reads all files (excluding `node_modules/`, `topics/`, `.vitepress/cache/`, `.vitepress/dist/`, `package-lock.json`), and generates `packages/cli/src/site/files.ts` as `export const SITE_FILES: Record<string, string> = {...}`
- [ ] 1.2 Handle TypeScript string escaping in generated output — properly escape backticks, `${` template literals, backslashes, and other special characters in file content
- [ ] 1.3 Integrate `bundle-site.ts` into `packages/cli/build.js` so it runs before `tsc` compilation, or add a `site:bundle` script to `packages/cli/package.json`
- [ ] 1.4 Unit test `bundle-site.ts` — verify all expected files are included, excluded paths are absent, string escaping is correct

## 2. VitePress dev project scaffold

- [ ] 2.1 Create `packages/cli/site/package.json` with `vitepress` and `vue` dependencies (matching versions that will be installed at runtime)
- [ ] 2.2 Create `packages/cli/site/.gitignore` with `node_modules`, `.vitepress/cache`, `.vitepress/dist`
- [ ] 2.3 Create `packages/cli/site/.vitepress/config.mts` — define site title, description, srcDir pointing to `../pages`, Vite alias `@data` → `../topics`, and custom theme entry
- [ ] 2.4 Create `packages/cli/site/.vitepress/theme/index.ts` — extend DefaultTheme, register all custom components globally, import custom CSS
- [ ] 2.5 Create `packages/cli/site/.vitepress/theme/styles/custom.css` — CSS variables, card grid layout, progress bar styles, status icon colors, tab styles

## 3. Route pages and dynamic paths

- [ ] 3.1 Create `packages/cli/site/pages/index.md` — thin Markdown stub that renders `<Dashboard />` component
- [ ] 3.2 Create `packages/cli/site/pages/topics/[slug].md` — thin stub that renders `<TopicPage :slug="params.slug" />`
- [ ] 3.3 Create `packages/cli/site/pages/topics/[slug].paths.js` — dynamic path loader that scans `../../topics/` for subdirectories containing `state.json` and returns `{ params: { slug } }` for each
- [ ] 3.4 Create `packages/cli/site/pages/topics/[slug]/[domain].md` — thin stub that renders `<DomainPage :slug="params.slug" :domain="params.domain" />`
- [ ] 3.5 Create `packages/cli/site/pages/topics/[slug]/[domain].paths.js` — dynamic path loader that scans `../../../topics/<slug>/sessions/` for domain directories and returns `{ params: { slug, domain } }` for each

## 4. Composables

- [ ] 4.1 Create `packages/cli/site/.vitepress/theme/composables/useI18n.ts` — reactive locale ref initialized from localStorage, `t(key)` function returning EN/zh-CN strings. Include all UI string keys: dashboard.title, dashboard.noTopics, dashboard.startLearning, topic.progress, topic.domains, topic.concepts, topic.mastered, domain.notes, domain.exercises, domain.noNotes, domain.noExercises, domain.backToMap, status.mastered, status.inProgress, status.needsPractice, status.unexplored, lang.switch
- [ ] 4.2 Create `packages/cli/site/.vitepress/theme/composables/useTopicData.ts` — data access layer with functions: `listAllTopics()` (scans `topics/` for state.json files, returns TopicSummary[]), `loadTopic(slug)` (reads and parses state.json), `scanSessions(slug, domain)` (lists .md files in sessions/<domain>/), `scanExercises(slug)` (lists exercise directories and files), `loadMarkdown(path)` (reads .md file content as string)

## 5. Vue components — Dashboard and TopicCard

- [ ] 5.1 Create `Dashboard.vue` — calls `useTopicData().listAllTopics()`, renders responsive grid of `<TopicCard>` components. Handles empty state with localized message. Contains a page title using `useI18n().t('dashboard.title')`
- [ ] 5.2 Create `TopicCard.vue` — props: `slug`, `name`, `domainCount`, `totalConcepts`, `masteredCount`. Renders a card with topic name, progress bar (`<ProgressBar>`), stats like "4/24 mastered". Click navigates to `/topics/{slug}`. Uses `useI18n()` for status labels
- [ ] 5.3 Create `ProgressBar.vue` — props: `value` (0-100), `label` (optional). Renders a CSS progress bar with animated fill transition
- [ ] 5.4 Create `StatusIcon.vue` — props: `status` ('mastered'|'in_progress'|'needs_practice'|'unexplored'). Renders colored circle icon

## 6. Vue components — TopicPage

- [ ] 6.1 Create `TopicPage.vue` — props: `slug`. Calls `useTopicData().loadTopic(slug)` to get state. Renders a two-column layout: left sidebar with domain list as `<router-link>` items (each links to `/topics/{slug}/{domain-slug}`), right content area rendering `knowledge-map.md`. Domain headings in knowledge map are clickable (navigates to domain page). Concept items are NOT clickable. Shows progress summary at top. Uses `useI18n()` for labels

## 7. Vue components — DomainPage, SessionNotes, ExerciseView

- [ ] 7.1 Create `DomainPage.vue` — props: `slug`, `domain`. Two-tab layout: "Notes" (default active) and "Exercises". Tab labels from `useI18n()`. Back link to topic page. Renders `<SessionNotes>` or `<ExerciseView>` based on active tab
- [ ] 7.2 Create `SessionNotes.vue` — props: `slug`, `domain`. Calls `useTopicData().scanSessions(slug, domain)` to get file list. Two-column layout: left panel lists .md filenames (date descending), right panel renders selected file's Markdown content using VitePress built-in Markdown rendering. First file auto-selected. Shows empty state if no notes
- [ ] 7.3 Create `ExerciseView.vue` — props: `slug`. Calls `useTopicData().scanExercises(slug)` to get exercise data. Groups exercises by concept (matching the current domain's concepts from state.json). Each concept group is a card showing available files (README.md, starter code, solution, practice records). Shows empty state if no exercises

## 8. Language switch component

- [ ] 8.1 Create `LanguageSwitch.vue` — toggle button rendering in VitePress navbar (via `layout-top` slot or theme extension). Displays current opposite language label. On click, toggles `useI18n().locale` and persists to localStorage

## 9. Dev fixtures for testing the site locally

- [ ] 9.1 Copy sample `state.json` and `knowledge-map.md` to `packages/cli/site/topics/javascript/` from the repo's `.learn/topics/javascript/`
- [ ] 9.2 Create sample session note files in `packages/cli/site/topics/javascript/sessions/` for at least 2 domains to test the Notes tab
- [ ] 9.3 Create sample exercise files in `packages/cli/site/topics/javascript/exercises/` for at least 1 concept to test the Exercises tab
- [ ] 9.4 Verify `cd packages/cli/site && npx vitepress dev` works end-to-end with fixture data

## 10. SiteGenerator class

- [ ] 10.1 Create `packages/cli/src/core/site-generator.ts` — `SiteGenerator` class that imports `SITE_FILES` from `../site/files.ts`, iterates entries, writes each to `.learn/<path>`. Implements overwrite rules: theme files skipped if exist (unless `force`), pages and config always written. Creates parent directories as needed
- [ ] 10.2 Implement `.gitignore` generation — always writes `.learn/.gitignore` with `node_modules/`, `.vitepress/cache/`, `.vitepress/dist/`, `pages/`
- [ ] 10.3 Export `SiteGenerator` from `packages/cli/src/index.ts` (public API)
- [ ] 10.4 Unit test `SiteGenerator` — verify correct file writing, overwrite rules (theme preserved, pages overwritten), .gitignore content, force mode

## 11. CLI integration — serve command

- [ ] 11.1 Add `serve [path]` command to `packages/cli/src/cli/index.ts` using Commander. Options: `--port <number>`, `--no-open`, `--force`
- [ ] 11.2 Implement serve flow: resolve path → ensure `.learn/` and `.learn/topics/` exist → call `SiteGenerator.generate()` → run `npm install --prefix .learn` (with spinner/feedback) → spawn `npx --prefix .learn vitepress dev .learn` with optional `--port` and `--open` flags → forward SIGINT/SIGTERM to child process
- [ ] 11.3 Add `--site` flag to `init [path]` command — after existing skill/command generation completes, call `SiteGenerator.generate()` without npm install or serve
- [ ] 11.4 Add `--site` flag to `update [path]` command — after existing update logic completes, call `SiteGenerator.generate()` (which will overwrite pages/config but preserve theme)
- [ ] 11.5 Add `--force` flag propagation: `init --site --force` and `serve --force` pass `force: true` to `SiteGenerator` to overwrite theme files
- [ ] 11.6 Add localized CLI messages for serve-related output in `packages/cli/src/i18n/locales/en.ts` and `zh-CN.ts`: "generating site files...", "installing dependencies...", "starting dev server...", "site ready at {url}"
- [ ] 11.7 Handle edge cases: npm not installed, vitepress install failure, port already in use, missing `.learn/` directory, empty topics directory
- [ ] 11.8 Integration test for `serve` command — verify it generates files, runs npm install (or at least writes package.json), attempts to start vitepress
- [ ] 11.9 Integration test for `init --site` — verify site files are generated alongside skill/command files
- [ ] 11.10 Integration test for `update --site` — verify pages/config are overwritten but theme files are preserved
- [ ] 11.11 Verify existing tests still pass — `init` without `--site` should behave identically to before
