## ADDED Requirements

### Requirement: SiteGenerator writes all template files on first generation

The system SHALL write all VitePress template files (configuration, theme components, composables, styles, route pages, package.json) to the `.learn/` directory when the `SiteGenerator.generate()` method is called and the target directory has no existing VitePress setup.

#### Scenario: First generation creates complete directory structure

- **WHEN** `SiteGenerator.generate()` is called and `.learn/.vitepress/` does not exist
- **THEN** the system creates `.learn/package.json`, `.learn/pages/index.md`, `.learn/pages/topics/[slug].md`, `.learn/pages/topics/[slug].paths.js`, `.learn/pages/topics/[slug]/[domain].md`, `.learn/pages/topics/[slug]/[domain].paths.js`, `.learn/.vitepress/config.mts`, `.learn/.vitepress/theme/index.ts`, all theme component files, all composable files, all style files, and `.learn/.gitignore`

#### Scenario: First generation writes theme components

- **WHEN** `SiteGenerator.generate()` is called for the first time
- **THEN** all files under `.vitepress/theme/` are written to disk

### Requirement: SiteGenerator preserves theme files on subsequent generation

The system SHALL skip writing theme component files if they already exist, unless the `--force` option is passed.

#### Scenario: Subsequent generation skips existing theme files

- **WHEN** `SiteGenerator.generate()` is called and `.learn/.vitepress/theme/components/Dashboard.vue` already exists
- **THEN** the system does NOT overwrite `Dashboard.vue` or any other existing file under `.vitepress/theme/`

#### Scenario: Force flag overwrites theme files

- **WHEN** `SiteGenerator.generate({ force: true })` is called
- **THEN** the system overwrites ALL theme files regardless of whether they already exist

### Requirement: SiteGenerator always overwrites pages and config

The system SHALL always overwrite route pages (`pages/**`) and VitePress configuration (`.vitepress/config.mts`) on every generation, regardless of whether they already exist.

#### Scenario: Subsequent generation overwrites pages

- **WHEN** `SiteGenerator.generate()` is called and `pages/index.md` already exists
- **THEN** the system overwrites `pages/index.md` with the latest template content

#### Scenario: Subsequent generation overwrites config

- **WHEN** `SiteGenerator.generate()` is called and `.vitepress/config.mts` already exists
- **THEN** the system overwrites `.vitepress/config.mts` with the latest template content

### Requirement: SiteGenerator writes .gitignore

The system SHALL write `.learn/.gitignore` with entries for `node_modules/`, `.vitepress/cache/`, `.vitepress/dist/`, and `pages/` on every generation.

#### Scenario: .gitignore is created or updated

- **WHEN** `SiteGenerator.generate()` is called
- **THEN** `.learn/.gitignore` exists and contains at minimum `node_modules/`, `.vitepress/cache/`, `.vitepress/dist/`, and `pages/`

### Requirement: SiteGenerator uses embedded file content

The system SHALL read all template file content from `packages/cli/src/site/files.ts`, which exports `SITE_FILES` as a `Record<string, string>` mapping relative file paths to file content strings. The `SiteGenerator` class SHALL NOT read from the filesystem at runtime to obtain template content.

#### Scenario: Template content comes from embedded mapping

- **WHEN** `SiteGenerator.generate()` writes a file to `.learn/`
- **THEN** the file content is sourced from the `SITE_FILES` constant, not from reading `packages/cli/site/` or any other directory on disk
