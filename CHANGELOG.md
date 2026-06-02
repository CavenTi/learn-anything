# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2026-05-30

### Fixed

- Relax `engines.node` from `>=20.19.0` to `>=20.0.0` for broader compatibility.

## [0.2.0] - 2026-05-29

### Added

- Dual-mode practice: Project Mode creates real code files in your IDE; Chat Mode for conceptual discussion.
- Persist learning session records for continuity across sessions.

### Fixed

- Reword session-save timing from "after" to "in the same turn" for clarity.

## [0.1.0] - 2026-05-28

### Added

- `learn-anything` CLI: generate skill and command files for 30+ AI coding tools.
- `init` command: interactive tool detection and selection, skill generation.
- `update` command: update existing skill files.
- Five learning workflows: topic, explain, practice, review, status.
- Locale support: English (`en`) and Chinese (`zh-CN`).
- MIT License.

[Unreleased]: https://github.com/ChenChenyaqi/learn-anything/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/ChenChenyaqi/learn-anything/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/ChenChenyaqi/learn-anything/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ChenChenyaqi/learn-anything/releases/tag/v0.1.0
