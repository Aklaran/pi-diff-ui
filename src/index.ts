// Core
export { computeDiff } from "./diff-engine";
export type { DiffLine, FileDiff } from "./diff-engine";

// State
export { DiffState } from "./diff-state";
export type { FileSnapshot } from "./diff-state";

// Views
export { InlineDiffView } from "./inline-view";
export type { HighlightFn } from "./inline-view";
export { DiffViewController } from "./diff-view-controller";

// Modal
export { DiffReviewModal } from "./modal";
export type { ModalFileEntry } from "./modal";

// Overlay
export { createOverlayHandler } from "./overlay";
export type {
  OverlayTui,
  OverlayTheme,
  OverlayKeyUtils,
  HighlightProvider,
  OverlayCallbacks,
  OverlayHandler,
  OverlayOptions,
} from "./overlay";

// Constants
export {
  SIDE_BY_SIDE_MIN_WIDTH,
  MAX_WIDGET_FILES,
  DIFF_CONTEXT_LINES,
  OVERLAY_WIDTH_PCT,
  OVERLAY_HEIGHT_PCT,
  ANSI_HIGHLIGHT_BG,
  ANSI_HIGHLIGHT_BG_OFF,
} from "./constants";
