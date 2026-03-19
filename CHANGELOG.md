# Changelog

All notable changes to SkillVault are documented here.

## [Unreleased]

### Security
- **Skill file integrity verification** — SHA-256 checksums are now bundled in `checksums.json` and verified before any install operation. A tampered or corrupt package will be detected and the install will abort with a clear error message. Run `npm run generate-checksums` before publishing a new version.
- **Versioned guardrails** — Injected guardrails now carry a `<!-- skillvault-guardrails:N -->` version tag. The `update` command replaces stale guardrails in place instead of silently skipping them.
- **Explicit file permissions** — Installed skill files are written with mode `0o644` and directories with mode `0o755`, preventing unexpected world-writable files on shared systems.

### Added
- **`--platform <list>`** — Comma-separated platform targeting in a single flag (e.g. `--platform claude,cursor`).
- **`--force`** — Bypass confirmation prompts and overwrite locally modified skill files during `update`.
- **`version` field in `.skillvaultrc`** — Config files now include `"version": 1`. A warning is emitted when loading configs without the field; run `skillvault init --save` to update.
- **`lib/args.js`**, **`lib/prompt.js`**, **`lib/reporter.js`** — CLI logic split into focused sub-modules for maintainability.
- **CI matrix expanded** — Tests now run on Ubuntu, macOS, and Windows against Node 18, 20, and 22.

### Changed
- **`remove --all`** now prompts for confirmation on TTY. Use `--force` to skip (e.g. in CI).
- **`update` always refreshes guardrails** — stale or unversioned guardrails are replaced in-place; current-version guardrails are skipped without a redundant write.
- **`update` summary** — Always prints a count breakdown (`N updated, M already up to date, K skipped`) even when nothing changed.
- **`--json` output** — All mutating commands now emit a consistent `{ command, files, dryRun }` envelope. `update` additionally includes a `summary` object.
- **Unknown flags** are now fatal (exit 1) with a pointer to `--help`, instead of a silent warning.
- **Locally modified skill files** are skipped during `update` with a stderr warning; use `--force` to overwrite.
- **Starter-pack pre-selection** — The interactive skill picker now pre-selects `review`, `scan-secrets`, and `audit-deps` by default instead of all skills.
- **Empty directories** are removed after `skillvault remove` empties them.
- `guardrails.md` path corrected from project root to `docs/guardrails.md`.

## [0.1.0] — Initial release

- 18 security skills across developer, security, cloud, and team categories.
- 14 supported AI coding platforms.
- Interactive CLI: `init`, `list`, `update`, `remove`, `doctor`.
- `.skillvaultrc` for reproducible team installs.
- Zero production dependencies.
