# pi-diff-ui

Framework-agnostic diff rendering for TUI overlays. Provides the core diff engine, inline view, file picker, and modal overlay used by [Diff Review](https://github.com/Aklaran/pi-diff) and [Sirdar](https://github.com/Aklaran/sirdar)'s `review_agent`.

> `pi-diff-ui` is a **library**, not a Pi extension. Do **not** place this repo under `~/.pi/agent/extensions` or list it in Pi's `settings.json -> extensions`; Pi will try to auto-load files like `src/index.ts` and `vitest.config.ts` as extensions.

## What It Does

- **DiffEngine** — computes unified diffs between file snapshots
- **DiffState** — manages a collection of file diffs (add entries, dismiss, track pending count)
- **InlineDiffView** — renders colorized inline diffs with cursor tracking, scrolling, and visual line selection
- **DiffViewController** — orchestrates view rendering within a modal overlay
- **Modal** — box-drawn overlay (╭╮│╰╯) with file picker and diff content
- **`createOverlayHandler()`** — turnkey function: give it TUI interfaces, get back a working overlay

## Architecture

The package defines minimal interfaces (`OverlayTui`, `OverlayTheme`, `OverlayKeyUtils`) that consumers implement. This inverts the dependency — pi-diff-ui doesn't know about Pi, but Pi extensions can use it by passing in their context.

```
Consumer (Pi extension)
  └─ implements OverlayTui, OverlayTheme, OverlayKeyUtils
       └─ passes to createOverlayHandler()
            └─ returns { show(), handleInput(), render() }
```

## Install

```bash
# As a dependency in another Pi package/extension
pnpm add file:../pi-diff-ui

# Or clone for development
git clone git@github.com:Aklaran/pi-diff-ui.git
cd pi-diff-ui && pnpm install && pnpm build
```

## Tests

```bash
pnpm test        # 163 tests
```

## Part of [Himal](https://github.com/Aklaran/himal) 🏔️

## License

MIT
