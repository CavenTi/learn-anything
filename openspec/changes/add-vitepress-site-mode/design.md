## Context

The learn-anything CLI currently generates skill files and command files for AI coding assistants. User learning data accumulates in `.learn/topics/` as structured JSON (`state.json`), Markdown session notes, and exercise files — but there is no built-in viewer for this data. Users can only see it by opening raw files.

We introduce an optional "site mode" that spins up a VitePress-powered local site to visualize learning progress. The site reads existing data from the filesystem without any additional build step. Users opt in via `--site` flag on `init`/`update`, or run `serve` directly.

### Development vs Runtime

A key constraint: we need a real VitePress project for development (HMR, Vue DevTools, TypeScript support), but at runtime the files must be written as plain strings from the CLI binary (no dependency on a `site/` source directory at the user's end). The solution is a build-time bundling step that embeds all site template files as a `Record<string, string>` into the compiled JavaScript.

## Goals / Non-Goals

**Goals:**

- Provide a `learn-anything serve` command that installs VitePress and starts a dev server for `.learn/`
- Add `--site` flag to `init`/`update` that generates VitePress template files into `.learn/`
- Deliver a Dashboard page showing all topics as cards with progress indicators
- Deliver a Topic page showing the knowledge map with a domain sidebar for navigation
- Deliver a Domain page with tabs for session notes and exercises
- Support EN/zh-CN UI language switching (UI strings only, not note content)
- Support a real VitePress dev project at `packages/cli/site/` for component development

**Non-Goals:**

- Building a production static site (`vitepress build`) — only `dev` server in v1
- Making concept items clickable — only domain-level navigation in v1
- Integrating `/learn:review` and `/learn:status` data into the site
- Content translation of user notes
- Write-back from the site to `state.json`
- Remote deployment or hosting

## Decisions

### 1. Dev project lives in `packages/cli/site/`, not a standalone package

**Rationale**: The site is tightly coupled to the CLI — it reads the same `state.json` format, uses the same `topics/` directory layout, and is only deployed via the CLI. A separate package would add publish/build complexity with no benefit. During development, `packages/cli/site/` can be opened as a standalone VitePress project (`cd packages/cli/site && npx vitepress dev`).

**Alternative considered**: A separate `packages/site/` package. Rejected because it increases monorepo complexity and the site has no independent value — it's always consumed by the CLI.

### 2. Build-time `fs.readFileSync` → `files.ts` mapping, not file copy to dist

**Rationale**: The CLI binary must contain all site files as strings so they can be written to `.learn/` at runtime without referencing a source directory. A build script scans `packages/cli/site/` (excluding `node_modules/`, `topics/`, `.gitignore`, `dist/`), reads each file, and generates `packages/cli/src/site/files.ts`:

```ts
export const SITE_FILES: Record<string, string> = {
  'package.json': `{...}`,
  '.vitepress/config.mts': `export default defineConfig({...})`,
  // ... all other files
};
```

This file is then compiled by `tsc` into the dist output. The `SiteGenerator` class imports `SITE_FILES` and writes each entry to the corresponding path under `.learn/`.

**Alternative considered**: Copying the `site/` directory to `dist/` and shipping it alongside the CLI binary. Rejected because it requires the binary to know its own location on disk to find the template files, which is fragile across different installation methods (npm global, npx, pnpm, local node_modules).

### 3. Dynamic routes `[slug].md` + `.paths.js` scan the filesystem at runtime

**Rationale**: VitePress supports dynamic route parameters via `.paths.js` files. Instead of regenerating page Markdown files every time a topic is added (which would require re-running `serve` or `init --site`), the `.paths.js` scripts use `fs.readdirSync` to discover topic and domain directories at request time. This means:

- Adding a new topic (via `/learn:topic`) requires zero regeneration
- Adding a new session creates a new domain directory, which `.paths.js` picks up on next page load
- VitePress HMR triggers when underlying data files change

The generated route pages (`index.md`, `[slug].md`, `[slug]/[domain].md`) are thin stubs that just mount the appropriate Vue component with route params.

**Alternative considered**: Generating individual `.md` files for every topic/domain during `serve` or `init --site`. Rejected because it requires re-running the generator whenever data changes.

### 4. Vite alias `@data` → `topics/` for filesystem access

**Rationale**: Vue components need a stable way to import data files relative to the project root, regardless of where the component is nested. In `config.mts`:

```ts
vite: {
  resolve: {
    alias: {
      '@data': fileURLToPath(new URL('../topics', import.meta.url))
    }
  }
}
```

Components then use `import.meta.url`-based path resolution or dynamic `import()` to load `state.json` and Markdown files.

### 5. Theme components: first-write-only, pages/config: always overwrite

**Rationale**: Users may customize the theme (colors, layout, components) after initial generation. Overwriting would destroy their changes. The strategy:

| File category           | On first generation | On subsequent generation   |
| ----------------------- | ------------------- | -------------------------- |
| `.vitepress/theme/**`   | Written             | Skipped (unless `--force`) |
| `.vitepress/config.mts` | Written             | Overwritten                |
| `pages/**`              | Written             | Overwritten                |
| `package.json`          | Written             | Overwritten                |
| `.gitignore`            | Written             | Overwritten                |

### 6. npm dependencies live in `.learn/node_modules/`

**Rationale**: Keeps site dependencies isolated from the user's project. `.learn/package.json` declares only `vitepress` and `vue`. The `serve` command runs `npm install --prefix .learn` before `npx --prefix .learn vitepress dev .learn`.

### 7. UI i18n uses a composable + localStorage, not VitePress site-level i18n

**Rationale**: VitePress's built-in i18n is designed for multi-language documentation sites where each locale has its own set of Markdown files. We only need to switch UI strings on the same set of components. A lightweight `useI18n()` composable with a string table stored in localStorage is simpler and avoids duplicating route pages.

### 8. CLI command structure

```
learn-anything init [path]              # unchanged
learn-anything init [path] --site       # adds site file generation
learn-anything update [path]            # unchanged
learn-anything update [path] --site     # adds site file regeneration
learn-anything serve [path]             # generate + npm install + vitepress dev
```

The `serve` command is separate from `init --site` because:

- Users may want to generate config without starting the server
- `serve` does a superset: it generates files (if not already), installs deps, and starts the server
- `init --site` is a passive setup step; `serve` is an active runtime step

## Risks / Trade-offs

- **VitePress version lock-in**: `.learn/package.json` specifies vitepress version. If the user already has vitepress installed globally, version conflicts are possible. Mitigation: use `--prefix .learn` to scope npm operations to `.learn/`.

- **Dynamic `.paths.js` fragility**: The `.paths.js` files use `fs` module calls with relative path computation. If VitePress changes its resolution of `.paths.js` files, the path logic may break. Mitigation: use `import.meta.url`-based path resolution which is standard and stable.

- **Windows path handling**: File paths in `.paths.js` and `config.mts` use `URL`-based resolution which normalizes platform differences. Testing on Windows is needed.

- **Large topic count**: Scanning all topics and their sessions on every page load could be slow with hundreds of topics. Not a concern in v1 (typical usage is 1-10 topics). Mitigation: can add caching later.

- **`serve` process management**: The vitepress dev server runs as a child process. The user terminates it with Ctrl+C. The CLI should forward signals cleanly and not leave orphaned processes.

## Open Questions

- Should `serve` support a `--port` option to specify the dev server port? (Default: VitePress default, 5173)
- Should `serve` open the browser automatically? (Default: yes, with an `--no-open` flag to disable)
