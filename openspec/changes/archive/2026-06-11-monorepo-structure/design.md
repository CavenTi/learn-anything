## Context

The `learn-anything-cli` project is currently a single npm package at the repository root. The `packages/` directory already exists with stale `core` and `cli` subdirectories containing only old dist artifacts (no source files, no `package.json`). There is no `pnpm-workspace.yaml`.

The goal is to convert to a proper pnpm monorepo with two packages: `packages/cli` (the existing CLI tool, published as `learn-anything-cli`) and `packages/gui` (a placeholder for a future GUI application).

## Goals / Non-Goals

**Goals:**

- Move all source code from root-level `src/`, `test/`, `bin/` into `packages/cli/`
- Root `package.json` becomes a workspace manager (`private: true`) with scripts delegating via `pnpm -r`
- `packages/cli/package.json` retains `"name": "learn-anything-cli"` and `"version": "0.4.2"`
- Add `pnpm-workspace.yaml` with `packages: ['packages/*']`
- Add `tsconfig.base.json` for shared compiler options
- Create `packages/gui/` with a README placeholder and private `package.json`
- Remove stale `packages/core/` directory

**Non-Goals:**

- No source code refactoring or dependency changes
- No functionality changes to `learn-anything-cli`
- No build system changes (still uses `tsc` via `build.js`)
- No test configuration changes (still uses vitest with same config)
- No CI changes (GitHub Actions left as-is unless paths break)
- The `packages/gui` package is not functional — README only

## Decisions

### Decision 1: File relocation strategy — plain `git mv`

All files move from root-level directories (`src/`, `test/`, `bin/`) into `packages/cli/` in their entirety. No file contents change during the move, except for a few config files that need path adjustments.

**Why not refactor during the move?** Keeping the move purely structural means zero risk of behavioral regressions. All 44 test files pass or fail identically before and after.

### Decision 2: `pnpm-workspace.yaml` over `package.json` workspaces

pnpm's native `pnpm-workspace.yaml` is the idiomatic choice. While pnpm does support `package.json` `workspaces` field, `pnpm-workspace.yaml` is pnpm-specific and supports features like catalog that we may use later.

### Decision 3: Shared `tsconfig.base.json`

Extract common compiler options to root `tsconfig.base.json`. Each package's `tsconfig.json` extends it and overrides `rootDir`/`outDir`.

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "lib": ["ES2022"],
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### Decision 4: Root scripts delegate via `pnpm -r`

```json
// Root package.json (relevant part)
{
  "private": true,
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "eslint packages/",
    "dev": "pnpm -r dev",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "prepare": "husky"
  }
}
```

**Why not use Turborepo?** Overkill for 2 packages where 1 is a placeholder. If we grow to 4+ packages, introducing Turborepo is a separate change.

### Decision 5: DevDependencies stay at root

All shared tooling (TypeScript, ESLint, Prettier, Vitest, commitlint, husky, lint-staged) remains in the root `package.json`'s `devDependencies`. Individual packages declare only their runtime `dependencies`. This avoids version drift and keeps `pnpm install` fast.

### Decision 6: Remove `packages/core/`

The `packages/core/` directory contains only stale `.js`/`.d.ts` dist files and no source. It was part of an earlier abandoned monorepo attempt. It is deleted entirely — nothing to preserve.

## File Relocation Map

| Source (root)                 | Destination                                                |
| ----------------------------- | ---------------------------------------------------------- |
| `src/` (37 files)             | `packages/cli/src/`                                        |
| `test/` (42 files)            | `packages/cli/test/`                                       |
| `bin/learn-anything.js`       | `packages/cli/bin/learn-anything.js`                       |
| `build.js`                    | `packages/cli/build.js`                                    |
| `vitest.config.ts`            | `packages/cli/vitest.config.ts`                            |
| `tsconfig.json`               | `packages/cli/tsconfig.json` (modified)                    |
| `package.json` (deps+scripts) | `packages/cli/package.json` (modified, minus tooling deps) |

## Files That Need Editing

1. **`packages/cli/package.json`** — same `name`/`version`/`dependencies`; `bin` path adjusts to `"./bin/learn-anything.js"`; `files` adjusts to `["dist", "bin"]`; devDependencies removed
2. **`packages/cli/tsconfig.json`** — add `"extends": "../../tsconfig.base.json"`, keep `rootDir`/`outDir` as `"./src"`/`"./dist"`
3. **`packages/cli/vitest.config.ts`** — `include` paths stay `['test/**/*.test.ts', 'test/**/*.spec.ts']` (relative to package root, unchanged)
4. **`packages/cli/bin/learn-anything.js`** — import path stays `'../dist/cli/index.js'` (relative, unchanged)
5. **`packages/cli/build.js`** — no changes (relative paths still work)
6. **`eslint.config.mjs`** — update `ignores` for `packages/*/dist/`, `packages/*/node_modules/`
7. **`.gitignore`** — add `packages/*/dist/` pattern
8. **`CLAUDE.md`** — update directory tree and paths
9. **`packages/gui/package.json`** — new file: `"name": "learn-anything-gui"`, `"private": true`
10. **`packages/gui/README.md`** — new file: placeholder text

## Risks / Trade-offs

- **[Tooling version drift]** → Mitigated: all devDependencies stay at root, enforced by a single source of truth. If a package-specific devDep is needed later, add it explicitly.
- **[pnpm install must succeed]** → Before moving files, `rm -rf node_modules packages/*/node_modules` to ensure clean state. Run `pnpm install` after restructure completes.
- **[CI may break]** → GitHub Actions paths (e.g., `pnpm build && pnpm test`) may need adjustment. Low risk if commands stay as `pnpm build` / `pnpm test` (delegated from root).
- **[User-installed package no longer works from root]** → After restructure, `pnpm build` at root runs `pnpm -r build`, which builds all packages. Consumers of the npm package are unaffected; only local development commands shift.
