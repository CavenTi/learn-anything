## ADDED Requirements

> **Note:** Updated to reflect actual implementation — exclusions include `dist/` and `pnpm-lock.yaml` instead of `.vitepress/cache/` and `.vitepress/dist/`.

### Requirement: Build script scans site directory and generates files.ts

The system SHALL provide a build script that scans `packages/cli/site/`, reads all template files, and generates `packages/cli/src/site/files.ts` exporting a `SITE_FILES` constant as `Record<string, string>`.

#### Scenario: Build script generates files.ts from site directory

- **WHEN** the build script runs with `packages/cli/site/` containing template files (Vue components, composables, styles, config files, etc.)
- **THEN** the script generates `packages/cli/src/site/files.ts` with a `SITE_FILES` export where each key is a relative file path and each value is the file's string content

#### Scenario: Build script uses TypeScript-compatible string encoding

- **WHEN** a template file contains characters that need escaping in a TypeScript string (backticks, `${`, backslashes)
- **THEN** the generated `files.ts` properly escapes those characters so the TypeScript compiler can parse the file

### Requirement: Build script excludes non-template directories

The system SHALL exclude `node_modules/`, `topics/`, `dist/`, `package-lock.json`, and `pnpm-lock.yaml` from the scanned files.

#### Scenario: node_modules is not included

- **WHEN** `packages/cli/site/node_modules/` exists (e.g., from running `pnpm install` during development)
- **THEN** no files from `node_modules/` appear in the generated `SITE_FILES`

#### Scenario: fixture topics are not included

- **WHEN** `packages/cli/site/topics/` contains fixture data for development
- **THEN** no files from `topics/` appear in the generated `SITE_FILES`

#### Scenario: dist directory is not included

- **WHEN** `packages/cli/site/dist/` exists (e.g., from running `vite build` during development)
- **THEN** no files from `dist/` appear in the generated `SITE_FILES`

### Requirement: Build script is integrated into the CLI build pipeline

The system SHALL run the site file bundling script as part of the CLI package build, before `tsc` compiles the TypeScript source. The generated `files.ts` SHALL be placed in `packages/cli/src/site/` so it is compiled into the dist output.

#### Scenario: pnpm build runs site bundling

- **WHEN** `pnpm build` or `pnpm -F learn-anything-cli build` is executed
- **THEN** the site file bundling script runs before TypeScript compilation, and the resulting `dist/` includes the compiled `files.js`

### Requirement: Build script uses Node.js fs and path APIs only

The system SHALL implement the build script using only Node.js built-in modules (`fs`, `path`). The script SHALL NOT require any third-party dependencies.

#### Scenario: Build script has zero external dependencies

- **WHEN** the build script is executed
- **THEN** it uses only `node:fs` and `node:path` imports and does not require `npm install` beyond the project's existing devDependencies
