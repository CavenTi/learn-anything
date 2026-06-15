## Why

Users currently have no visual way to browse their learning progress, notes, and exercises outside of individual AI coding assistant interactions. The `.learn/` directory contains rich structured data (`state.json`, session notes, exercises) but no built-in viewer. Adding an optional VitePress-powered site gives users a browsable dashboard that visualizes their learning journey, making it easy to review notes, track progress across topics, and revisit exercises — all in a fast, modern static site served locally.

## What Changes

- **New CLI command**: `learn-anything serve [path]` — one command that generates VitePress files, installs dependencies, and starts the dev server
- **New site flag**: `learn-anything init [path] --site` and `learn-anything update [path] --site` — generates VitePress configuration and UI components into `.learn/` without installing or starting the server
- **New dev project**: `packages/cli/site/` — a standalone VitePress project for developing and debugging theme components with live HMR
- **New `SiteGenerator` class**: handles writing template files to `.learn/`, with smart overwrite rules (pages/config always regenerated, theme components preserved unless `--force`)
- **Build integration**: a build-time script scans `packages/cli/site/` and generates `packages/cli/src/site/files.ts` as a `Record<string, string>` mapping embedded in the CLI binary
- **No breaking changes**: all existing `init` and `update` behavior is unchanged; site mode is purely opt-in via `--site` flag

## Capabilities

### New Capabilities

- `site-generator`: Core logic for writing VitePress files to `.learn/`, including the file registry, overwrite rules (pages/config always, theme once), and `.gitignore` generation
- `site-theme`: VitePress custom theme with Vue components (Dashboard, TopicCard, TopicPage, DomainPage, SessionNotes, ExerciseView) and i18n composable for EN/zh-CN UI strings
- `site-cli`: The `serve` command and `--site` flags on `init`/`update`, including npm install and vitepress dev process spawning
- `site-build`: Build-time script that scans `packages/cli/site/`, reads all template files, and generates `packages/cli/src/site/files.ts` as a string map for runtime use

### Modified Capabilities

<!-- No existing capabilities are modified. This is purely additive. -->

## Impact

- **New dependency**: `vitepress` and `vue` in `.learn/package.json` (not in the CLI package itself — installed at serve time into `.learn/node_modules/`)
- **New source directory**: `packages/cli/site/` (~15-20 files: Vue components, composables, styles, config, route pages)
- **New source files**: `packages/cli/src/core/site-generator.ts`, `packages/cli/src/site/files.ts` (auto-generated at build time)
- **Modified files**: `packages/cli/src/cli/index.ts` (new `serve` command, `--site` option on `init`/`update`), `packages/cli/src/core/init.ts` (call `SiteGenerator` when `--site` is set), `packages/cli/build.js` (run site file bundling script)
- **No changes to**: existing learn-protocol types/schemas, skill/command templates, rendering scripts, i18n locale files
