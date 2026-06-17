## Context

The learn-anything CLI currently generates skill files and command files for AI coding assistants. User learning data accumulates in `.learn/topics/` as structured JSON (`state.json`), Markdown session notes, and exercise files — but there is no built-in viewer for this data. Users can only see it by opening raw files.

We introduce an optional "site mode" that spins up a local site to visualize learning progress. The site reads existing data from the filesystem without any additional build step. Users opt in via `--site` flag on `init`/`update`, or run `serve` directly.

### Development vs Runtime

A key constraint: we need a real dev project for component development (HMR, Vue DevTools, TypeScript support), but at runtime the files must be written as plain strings from the CLI binary (no dependency on a `site/` source directory at the user's end). The solution is a build-time bundling step that embeds all site template files as a `Record<string, string>` into the compiled JavaScript.

## Goals / Non-Goals

**Goals:**

- Provide a `learn-anything serve` command that installs dependencies and starts a Vite dev server for `.learn/` _(pending)_
- Add `--site` flag to `init`/`update` that generates site template files into `.learn/` _(pending)_
- Deliver a Dashboard page showing all topics as cards with progress indicators ✅
- Deliver a Topic page with domain/exercise sidebar navigation ✅
- Support viewing session notes (Markdown) and exercise files (Markdown or code with syntax highlighting) ✅
- Support EN/zh-CN UI language switching (UI strings only, not note content) ✅
- Support a real Vue 3 + Vite dev project at `packages/cli/site/` for component development ✅
- Match VitePress design system aesthetics (colors, typography, spacing, component styles) ✅

**Non-Goals:**

- Building a production static site (`vite build` works but is not the primary use case)
- Integrating `/learn:review` and `/learn:status` data into the site
- Content translation of user notes
- Write-back from the site to `state.json`
- Remote deployment or hosting

## Decisions

### 1. Custom Vue 3 + Vite application instead of VitePress

**Rationale**: VitePress is designed for documentation sites with file-based Markdown routing. Our use case — a learning dashboard with dynamic sidebar navigation, file-based content browsing, and interactive topic exploration — requires more UI flexibility than VitePress themes provide. A custom Vue 3 application gives us:

- Full control over routing (Vue Router with `createWebHistory`)
- Flexible sidebar/content communication via `provide/inject`
- No VitePress theme extension constraints
- Tailwind CSS v4 for utility-first styling

The cost is losing VitePress's built-in features (file-based routing, automatic nav generation, built-in search). These are acceptable trade-offs — the app has only 2 routes, nav is sidebar-driven, and search is not yet needed.

**Alternative considered**: VitePress custom theme. Initially attempted, but the theme system proved too restrictive for the dual-tab sidebar (TOPICS/EXERCISES), dynamic file-tree navigation, and mixed content rendering (Markdown + code syntax highlighting). Custom Vue app was a cleaner fit.

### 2. Dev project lives in `packages/cli/site/`, not a standalone package

**Rationale**: The site is tightly coupled to the CLI — it reads the same `state.json` format, uses the same `topics/` directory layout, and is only deployed via the CLI. A separate package would add publish/build complexity with no benefit. During development, `packages/cli/site/` can be opened as a standalone Vite project (`cd packages/cli/site && npx vite`).

**Alternative considered**: A separate `packages/site/` package. Rejected because it increases monorepo complexity and the site has no independent value — it's always consumed by the CLI.

### 3. Build-time `fs.readFileSync` → `files.ts` mapping, not file copy to dist

**Rationale**: The CLI binary must contain all site files as strings so they can be written to `.learn/` at runtime without referencing a source directory. A build script scans `packages/cli/site/` (excluding `node_modules/`, `topics/`, `dist/`, `package-lock.json`, `pnpm-lock.yaml`), reads each file, and generates `packages/cli/src/site/files.ts`:

```ts
export const SITE_FILES: Record<string, string> = {
  'package.json': `{...}`,
  'src/main.ts': `import { createApp } from 'vue';...`,
  // ... all other files
};
```

This file is then compiled by `tsc` into the dist output. The `SiteGenerator` class imports `SITE_FILES` and writes each entry to the corresponding path under `.learn/`.

**Alternative considered**: Copying the `site/` directory to `dist/` and shipping it alongside the CLI binary. Rejected because it requires the binary to know its own location on disk to find the template files, which is fragile across different installation methods (npm global, npx, pnpm, local node_modules).

### 4. Vue Router with 2 explicit routes, not file-based routing

**Rationale**: The site has a small, fixed route structure — a Dashboard (`/`) and Topic pages (`/topics/:slug`). Vue Router with `createWebHistory` handles this cleanly without VitePress's file-based route conventions. Routes are defined in `src/router/index.ts`:

```ts
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: () => import('../components/Dashboard.vue') },
    {
      path: '/topics/:slug',
      name: 'topic',
      component: () => import('../components/TopicPage.vue'),
      props: true,
    },
  ],
});
```

**Alternative considered**: VitePress dynamic routes with `[slug].md` + `.paths.js`. Rejected because custom Vue Router gives more control and avoids VitePress's file-based convention entirely.

### 5. `import.meta.glob` for build-time data loading

**Rationale**: Components need to discover topics, domains, sessions, and exercises from the filesystem. Vite's `import.meta.glob` (eager mode) resolves all matching files at build time, giving us a static map of file paths to content. This replaces VitePress's `.paths.js` runtime filesystem scanning.

```ts
const stateFiles = import.meta.glob<string>('/topics/*/state.json', {
  query: '?raw',
  import: 'default',
  eager: true,
});
```

This approach:

- Works at build time, so the dev server and production build see the same data
- No runtime `fs` module dependency in browser code
- Vite HMR triggers when underlying data files change

### 6. Sidebar-content communication via `provide/inject`

**Rationale**: The `AppSidebar` and `TopicPage` components need to communicate file selection state. Vue's `provide/inject` pattern lets `App.vue` hold the shared `topicSelectedFile` ref and provide it to `TopicPage.vue`, while `AppSidebar` emits events upward:

```
App.vue (holds topicSelectedFile ref, provides to TopicPage)
├── AppSidebar.vue (emits: file-selected, topic-selected, back-to-dashboard)
└── TopicPage.vue (injects: topicSelectedFile)
        └── ContentViewer.vue (receives file prop)
```

This avoids prop drilling through `<router-view>` and keeps the sidebar decoupled from route-specific components.

### 7. TOPICS/EXERCISES dual-tab sidebar in topic mode

**Rationale**: Users need to browse both session notes and exercise files for a topic. Rather than separate pages (the VitePress DomainPage approach), both are integrated into the sidebar via tabs:

```
┌──────────────────────────┐
│  [ TOPICS | EXERCISES ]  │  ← tab bar with underline active style
├──────────────────────────┤
│  root-node: topic name   │  ← click returns to knowledge map
│  ▼ domain 1               │  ← expandable domain groups
│      session-1.md         │  ← click to view in ContentViewer
│      session-2.md         │
│  ▶ domain 2               │
│  ...                      │
└──────────────────────────┘
```

Exercise mode shows concept groups with expandable file lists. File type detection (Markdown vs code) determines rendering in ContentViewer.

### 8. ContentViewer for pure content rendering

**Rationale**: When a file is selected from the sidebar, the right side should show ONLY the rendered content — no headers, progress bars, or navigation chrome. `ContentViewer.vue` receives a `SelectedFile` object:

```ts
interface SelectedFile {
  path: string;
  content: string;
  type: 'markdown' | 'code';
}
```

- Markdown files render into a `.prose-content` div (styled to match VitePress `vp-doc.css`)
- Code files render as syntax-highlighted `<pre><code>` blocks with a filename label

### 9. VitePress design system emulation

**Rationale**: VitePress has a well-established visual design that users find familiar and trustworthy. Rather than invent a new design language, we replicate VitePress's design system:

- **Color tokens**: `--color-text-1/2/3`, `--color-bg/--color-bg-alt/--color-bg-soft`, `--color-divider/--color-border`, `--color-brand-1/2/3` (red accent instead of VitePress indigo)
- **Typography**: Inter font, 600 weight headings, 3-level text hierarchy
- **Sidebar**: 272px width, `bg-alt` background, no border-right
- **Content**: `.prose-content` matching `vp-doc.css` — h1 28/32px, h2 24px with border-top, 16px paragraph margins, 28px line-height, code block negative margins on mobile, zebra table striping, etc.
- **Dark mode**: Class-based (`.dark` on `<html>`), matches VitePress dark palette

### 10. npm dependencies in `.learn/package.json` (user's project)

**Rationale**: Keeps site dependencies isolated from the user's project. For the runtime mode _(pending)_, `.learn/package.json` will declare `vue`, `vue-router`, `markdown-it`, `highlight.js`, and dev dependencies for Vite. The `serve` command runs `npm install --prefix .learn` before `npx --prefix .learn vite .learn`.

### 11. UI i18n uses a composable + localStorage

**Rationale**: We only need to switch UI strings on the same set of components — not duplicate pages per locale. A `useI18n()` composable with a string table stored in localStorage is simpler than framework-level i18n.

### 12. Theme files: first-write-only, pages/config: always overwrite

**Rationale**: Users may customize the theme after initial generation. Overwriting would destroy their changes. The strategy:

| File category        | On first generation | On subsequent generation   |
| -------------------- | ------------------- | -------------------------- |
| `src/components/**`  | Written             | Skipped (unless `--force`) |
| `src/composables/**` | Written             | Skipped (unless `--force`) |
| `src/styles/**`      | Written             | Skipped (unless `--force`) |
| `vite.config.ts`     | Written             | Overwritten                |
| `index.html`         | Written             | Overwritten                |
| `package.json`       | Written             | Overwritten                |
| `.gitignore`         | Written             | Overwritten                |

### 13. CLI command structure

```
learn-anything init [path]              # unchanged
learn-anything init [path] --site       # adds site file generation
learn-anything update [path]            # unchanged
learn-anything update [path] --site     # adds site file regeneration
learn-anything serve [path]             # generate + npm install + vite dev
```

The `serve` command is separate from `init --site` because:

- Users may want to generate config without starting the server
- `serve` does a superset: it generates files (if not already), installs deps, and starts the server
- `init --site` is a passive setup step; `serve` is an active runtime step

## Risks / Trade-offs

- **No file-based routing**: Unlike VitePress where adding a `.md` file creates a route, adding new content types requires Vue Router route definitions. Mitigation: the app has only 2 routes and all content browsing is sidebar-driven — new content types just add sidebar tree nodes.

- **Tailwind CSS v4 maturity**: Tailwind v4 is newer and has different configuration patterns than v3. Mitigation: v4 is stable and the `@tailwindcss/vite` plugin is officially supported.

- **Large topic count**: Scanning all topics and their sessions could be slow with hundreds of topics. Not a concern in v1 (typical usage is 1-10 topics). Mitigation: `import.meta.glob` resolves at build time, so load is only at compile time, not runtime.

- **`serve` process management** _(pending)_: The vite dev server runs as a child process. The user terminates it with Ctrl+C. The CLI should forward signals cleanly and not leave orphaned processes.

- **Windows path handling**: File paths in `import.meta.glob` use POSIX separators. Testing on Windows is needed.

## Open Questions

- Should `serve` support a `--port` option to specify the dev server port? (Default: Vite default, 5173)
- Should `serve` open the browser automatically? (Default: yes, with a `--no-open` flag to disable)
