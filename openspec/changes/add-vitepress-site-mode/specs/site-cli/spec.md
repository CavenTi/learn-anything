## ADDED Requirements

> **Status: Pending implementation.** The dev project at `packages/cli/site/` is fully functional, but the CLI commands (`serve`, `init --site`, `update --site`) have not yet been created.

> **Note:** The original spec referenced VitePress (`vitepress dev`). The actual implementation uses Vite (`vite dev`). The requirements below have been updated accordingly.

### Requirement: serve command generates files, installs dependencies, and starts Vite dev server

The system SHALL provide a `learn-anything serve [path]` command that: (1) calls `SiteGenerator.generate()` to write template files to `.learn/`, (2) runs `npm install --prefix .learn` to install vue, vue-router, markdown-it, highlight.js, and Vite dev dependencies, and (3) spawns `npx --prefix .learn vite .learn` as a child process that the user can terminate with Ctrl+C.

#### Scenario: serve generates files before starting

- **WHEN** user runs `learn-anything serve` in a project directory
- **THEN** the system writes all site template files to `.learn/` before attempting npm install

#### Scenario: serve installs npm dependencies

- **WHEN** user runs `learn-anything serve` and `.learn/package.json` exists
- **THEN** the system runs `npm install --prefix .learn` and waits for it to complete before starting the dev server

#### Scenario: serve starts Vite dev server

- **WHEN** npm install completes successfully
- **THEN** the system spawns `npx --prefix .learn vite .learn` and prints the local URL to the console

#### Scenario: serve handles missing .learn directory

- **WHEN** user runs `learn-anything serve` in a project that has no `.learn/` directory
- **THEN** the system creates `.learn/` and `.learn/topics/` directories, writes template files, and proceeds with install and serve

### Requirement: init --site generates files without installing or serving

The system SHALL accept a `--site` flag on the `learn-anything init` command. When `--site` is present, the system SHALL call `SiteGenerator.generate()` after skill and command generation completes. The system SHALL NOT run `npm install` or start the Vite dev server in `init --site` mode.

#### Scenario: init --site generates site files

- **WHEN** user runs `learn-anything init --site` in a project directory
- **THEN** the system generates both skill/command files and site template files in `.learn/`

#### Scenario: init --site does not start a server

- **WHEN** user runs `learn-anything init --site`
- **THEN** the system does NOT run npm install or vite dev

#### Scenario: init without --site behaves as before

- **WHEN** user runs `learn-anything init` without the `--site` flag
- **THEN** the system generates skill/command files exactly as it did before this change, with no site-related side effects

### Requirement: update --site regenerates config files

The system SHALL accept a `--site` flag on the `learn-anything update` command. When `--site` is present, the system SHALL call `SiteGenerator.generate()` after updating skill/command files, which overwrites config files (`vite.config.ts`, `package.json`, etc.) but preserves existing component/composable/style files.

#### Scenario: update --site regenerates config files

- **WHEN** user runs `learn-anything update --site` in a project that previously had `init --site` run
- **THEN** the system overwrites `vite.config.ts`, `package.json`, `index.html` but does NOT overwrite existing `src/components/` files

#### Scenario: update without --site behaves as before

- **WHEN** user runs `learn-anything update` without the `--site` flag
- **THEN** the system updates skill/command files exactly as it did before this change, with no site-related side effects

### Requirement: serve supports optional port and open flags

The system SHALL support `--port <number>` to specify the Vite dev server port and `--no-open` to prevent automatic browser opening on `serve`.

#### Scenario: serve with custom port

- **WHEN** user runs `learn-anything serve --port 8080`
- **THEN** the Vite dev server starts on port 8080

#### Scenario: serve without opening browser

- **WHEN** user runs `learn-anything serve --no-open`
- **THEN** the Vite dev server starts but the system does NOT open the browser automatically

### Requirement: serve forwards exit signals cleanly

The system SHALL forward SIGINT and SIGTERM signals from the CLI process to the Vite child process, and SHALL clean up the child process when the user presses Ctrl+C.

#### Scenario: Ctrl+C stops the dev server

- **WHEN** user presses Ctrl+C while the Vite dev server is running
- **THEN** the Vite child process terminates and the CLI exits cleanly
