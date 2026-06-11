## 1. Cleanup

- [x] 1.1 Delete stale `packages/core/` directory (contains only old dist artifacts, no source)
- [x] 1.2 Delete stale `packages/cli/dist/` directory (will be rebuilt after restructure)
- [x] 1.3 Delete stale `packages/cli/node_modules/` directory
- [x] 1.4 Delete root `node_modules/` to ensure clean install after restructure

## 2. Workspace Configuration

- [x] 2.1 Create `pnpm-workspace.yaml` with `packages: ['packages/*']`
- [x] 2.2 Create `tsconfig.base.json` with shared compiler options extracted from current `tsconfig.json`
- [x] 2.3 Convert root `package.json` to workspace manager: set `"private": true`, scripts delegate via `pnpm -r`, remove `exports`/`bin`/`files`/`dependencies`, keep `devDependencies`

## 3. Move CLI Package

- [x] 3.1 Create `packages/cli/src/` directory and move all files from root `src/` via `git mv`
- [x] 3.2 Create `packages/cli/test/` directory and move all files from root `test/` via `git mv`
- [x] 3.3 Move `bin/` directory into `packages/cli/bin/` via `git mv`
- [x] 3.4 Move `build.js` into `packages/cli/build.js` via `git mv`
- [x] 3.5 Move `vitest.config.ts` into `packages/cli/vitest.config.ts` via `git mv`
- [x] 3.6 Create `packages/cli/package.json`: same name (`learn-anything-cli`), version (`0.4.2`), description, dependencies. Adjust `bin` to `"./bin/learn-anything.js"` and `files` to `["dist", "bin"]`. Remove devDependencies (managed at root).
- [x] 3.7 Create `packages/cli/tsconfig.json` extending `../../tsconfig.base.json`, with `rootDir: "./src"` and `outDir: "./dist"`
- [x] 3.8 Delete now-empty root `src/`, `test/`, `bin/` directories

## 4. Create GUI Placeholder

- [x] 4.1 Create `packages/gui/package.json` with `"name": "learn-anything-gui"`, `"private": true`, `"version": "0.1.0"`
- [x] 4.2 Create `packages/gui/README.md` with placeholder text in English and Chinese: "GUI is under construction / GUI 正在建设中"

## 5. Update Cross-Cutting Config

- [x] 5.1 Update `eslint.config.mjs`: add `packages/*/dist/` and `packages/*/node_modules/` to ignores
- [x] 5.2 Update `.gitignore`: update test output paths
- [x] 5.3 Update `CLAUDE.md`: reflect new directory structure (src/ → packages/cli/src/, etc.)
- [x] 5.4 Update `CONTRIBUTING.md`: reflect new paths if any referenced (no changes needed)

## 6. Install and Verify

- [x] 6.1 Run `pnpm install` to regenerate lock file and link workspace packages
- [x] 6.2 Run `pnpm build` to verify `packages/cli` compiles successfully
- [x] 6.3 Run `pnpm test` to verify all tests pass
- [x] 6.4 Run `node packages/cli/bin/learn-anything.js --version` to verify CLI works
- [x] 6.5 Update CI workflow typecheck path for monorepo tsconfig
