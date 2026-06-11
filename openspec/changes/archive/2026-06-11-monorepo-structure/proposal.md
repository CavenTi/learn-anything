## Why

The project is a single-package npm package, but we plan to add a GUI application and potentially more packages in the future. Converting to a pnpm monorepo now establishes a scalable structure — the `cli` package remains the published `learn-anything-cli`, while a new `gui` package provides a landing spot for GUI development, starting as a placeholder.

## What Changes

- **Restructure into `packages/cli/`**: Move all existing source code (`src/`, `test/`, `bin/`, `build.js`, `vitest.config.ts`, `tsconfig.json`, `package.json`) into `packages/cli/` — no file contents change except path adjustments in `package.json` and `tsconfig.json`
- **Create `packages/gui/`**: New placeholder package with only a `README.md` indicating "under construction / 正在建设中" and a private `package.json`
- **Delete `packages/core/`**: Remove stale directory that contains only old dist artifacts with no source files
- **Add `pnpm-workspace.yaml`**: Define workspace packages as `packages/*`
- **Add `tsconfig.base.json`**: Shared compiler options extended by individual packages
- **Simplify root `package.json`**: Root becomes a workspace manager (`private: true`) with scripts that delegate via `pnpm -r`; devDependencies for shared tooling remain at root (husky, prettier, commitlint, eslint)

## Capabilities

### New Capabilities

None — this is a structural change with no new user-facing capabilities.

### Modified Capabilities

None — existing spec-level behavior (`learn-protocol`, `render-script`, `skill-workflows`) is unchanged.

## Impact

- All source files relocate from root-level `src/` to `packages/cli/src/`
- All test files relocate from root-level `test/` to `packages/cli/test/`
- `bin/learn-anything.js` moves to `packages/cli/bin/learn-anything.js`
- `CLAUDE.md` path references need updating
- `.gitignore` patterns may need adjustment for `packages/*/dist/`
- CI (`.github/workflows/`) may need path updates for build/test commands
- `pnpm-lock.yaml` will be regenerated after `pnpm install`
- Public API unchanged — `npx learn-anything-cli init` still works
- This change is **not BREAKING** for consumers of the npm package
