## No Behavioral Changes

This change is a purely structural refactor: converting the repository from a single-package layout to a pnpm monorepo workspace. No user-facing behavior, APIs, CLI commands, or data formats are modified.

- **`learn-anything-cli`** package retains all existing functionality — the same code runs from `packages/cli/` instead of root `src/`
- **`learn-anything-gui`** is a new placeholder package containing only a README — it has no runtime behavior
- All existing specs (`learn-protocol`, `render-script`, `skill-workflows`) remain unchanged

No requirements, scenarios, or testable assertions apply at the spec level for this change.
