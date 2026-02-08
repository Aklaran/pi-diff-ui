# Changelog

## 0.2.0 (2026-02-07)

### Added
- `DiffState.toJSON()` / `DiffState.fromJSON()` for persistence across reloads
- `createPickerHandler()` — generic list picker overlay component
- `SerializedDiffState` type export

### Changed
- Package now builds to `dist/` via TypeScript compiler
- All relative imports use `.js` extensions for ESM compatibility

## 0.1.0 (2026-02-07)

### Added
- Initial extraction from diff-review extension
- `DiffState`, `DiffEngine`, `InlineDiffView`, `DiffViewController`
- `DiffReviewModal` for file navigation
- `createOverlayHandler()` — framework-agnostic TUI overlay
- Minimal interfaces (`OverlayTui`, `OverlayTheme`, `OverlayKeyUtils`) instead of Pi SDK dependency
