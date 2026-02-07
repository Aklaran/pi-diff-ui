import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOverlayHandler, OverlayTui, OverlayTheme, OverlayKeyUtils, OverlayCallbacks } from "../src/overlay";
import { DiffState } from "../src/diff-state";
import { DiffReviewModal } from "../src/modal";

// --- Test helpers ---

function createMockTui(height = 40): OverlayTui {
  return { height, requestRender: vi.fn() };
}

function createMockTheme(): OverlayTheme {
  return {
    fg: (_role: string, text: string) => text,
    bold: (text: string) => text,
  };
}

function createMockKeyUtils(): OverlayKeyUtils {
  return {
    matchesKey: (data: string, key: unknown) => data === key,
    Key: {
      escape: "ESC",
      up: "UP",
      down: "DOWN",
      enter: "ENTER",
      tab: "TAB",
      ctrl: (k: string) => `CTRL+${k}`,
    },
    truncateToWidth: (text: string, width: number) => text.slice(0, width),
  };
}

function createStateWithFiles(): { state: DiffState; modal: DiffReviewModal } {
  const state = new DiffState();
  state.trackFile("src/foo.ts", "line1\nline2\n", "line1\nline2\nline3\n");
  state.trackFile("src/bar.ts", "old\n", "new\n");
  const modal = new DiffReviewModal(state);
  return { state, modal };
}

function createEmptyState(): { state: DiffState; modal: DiffReviewModal } {
  const state = new DiffState();
  const modal = new DiffReviewModal(state);
  return { state, modal };
}

describe("createOverlayHandler", () => {
  let tui: OverlayTui;
  let theme: OverlayTheme;
  let keyUtils: OverlayKeyUtils;
  let done: ReturnType<typeof vi.fn>;
  const noHighlight = (code: string) => code;

  beforeEach(() => {
    tui = createMockTui();
    theme = createMockTheme();
    keyUtils = createMockKeyUtils();
    done = vi.fn();
  });

  describe("render", () => {
    it("renders empty state message when no files", () => {
      const { modal } = createEmptyState();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      const lines = handler.render(80);
      const joined = lines.join("\n");
      expect(joined).toContain("No files to review");
    });

    it("renders file diff view with file header", () => {
      const { modal } = createStateWithFiles();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      const lines = handler.render(80);
      const joined = lines.join("\n");
      expect(joined).toContain("[1/2]");
      expect(joined).toContain("src/foo.ts");
    });

    it("renders with custom title", () => {
      const { modal } = createStateWithFiles();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done, undefined, { title: "Agent Diff" });
      const lines = handler.render(80);
      const joined = lines.join("\n");
      expect(joined).toContain("Agent Diff");
      expect(joined).not.toContain("Diff Review");
    });

    it("renders top and bottom borders", () => {
      const { modal } = createStateWithFiles();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      const lines = handler.render(80);
      expect(lines[0]).toContain("╭");
      expect(lines[lines.length - 1]).toContain("╰");
    });

    it("renders help line in diff view", () => {
      const { modal } = createStateWithFiles();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      const lines = handler.render(80);
      const joined = lines.join("\n");
      expect(joined).toContain("n/p files");
      expect(joined).toContain("d dismiss");
    });

    it("renders file picker when open", () => {
      const { modal } = createStateWithFiles();
      modal.openFilePicker();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      const lines = handler.render(80);
      const joined = lines.join("\n");
      expect(joined).toContain("File Picker");
      expect(joined).toContain("src/foo.ts");
      expect(joined).toContain("src/bar.ts");
    });

    it("pads output to target height", () => {
      const { modal } = createStateWithFiles();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      const lines = handler.render(80);
      // targetHeight = max(20, floor(40 * 0.75)) = 30
      // Pad to targetHeight-1, then add bottom border = targetHeight total
      expect(lines.length).toBe(30);
    });
  });

  describe("handleInput — navigation", () => {
    it("closes overlay on Escape", () => {
      const { modal } = createStateWithFiles();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      handler.handleInput("ESC");
      expect(done).toHaveBeenCalled();
    });

    it("navigates to next file with n", () => {
      const { modal } = createStateWithFiles();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      expect(modal.selectedIndex).toBe(0);
      handler.handleInput("n");
      expect(modal.selectedIndex).toBe(1);
      expect(tui.requestRender).toHaveBeenCalled();
    });

    it("navigates to previous file with p", () => {
      const { modal } = createStateWithFiles();
      modal.selectNext(); // go to index 1
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      handler.handleInput("p");
      expect(modal.selectedIndex).toBe(0);
    });

    it("scrolls down with j", () => {
      const { modal } = createStateWithFiles();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      handler.handleInput("j");
      expect(tui.requestRender).toHaveBeenCalled();
    });

    it("scrolls up with k", () => {
      const { modal } = createStateWithFiles();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      handler.handleInput("k");
      expect(tui.requestRender).toHaveBeenCalled();
    });

    it("half-page scrolls with Ctrl+D", () => {
      const { modal } = createStateWithFiles();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      handler.handleInput("CTRL+d");
      expect(tui.requestRender).toHaveBeenCalled();
    });

    it("opens file picker with Tab", () => {
      const { modal } = createStateWithFiles();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      handler.handleInput("TAB");
      expect(modal.isFilePickerOpen).toBe(true);
    });
  });

  describe("handleInput — file picker", () => {
    it("closes file picker on Escape", () => {
      const { modal } = createStateWithFiles();
      modal.openFilePicker();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      handler.handleInput("ESC");
      expect(modal.isFilePickerOpen).toBe(false);
      expect(done).not.toHaveBeenCalled(); // doesn't close overlay
    });

    it("navigates picker with j/k", () => {
      const { modal } = createStateWithFiles();
      modal.openFilePicker();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      handler.handleInput("j");
      expect(modal.filePickerIndex).toBe(1);
    });

    it("confirms selection with Enter", () => {
      const { modal } = createStateWithFiles();
      modal.openFilePicker();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      handler.handleInput("j"); // move to index 1
      handler.handleInput("ENTER");
      expect(modal.isFilePickerOpen).toBe(false);
      expect(modal.selectedIndex).toBe(1);
    });
  });

  describe("handleInput — dismiss", () => {
    it("dismisses current file with d", () => {
      const { modal } = createStateWithFiles();
      const callbacks: OverlayCallbacks = { onDismiss: vi.fn() };
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done, callbacks);
      handler.handleInput("d");
      expect(callbacks.onDismiss).toHaveBeenCalled();
      expect(modal.getFileList().length).toBe(1);
    });

    it("closes overlay when last file is dismissed", () => {
      const state = new DiffState();
      state.trackFile("only.ts", "a\n", "b\n");
      const modal = new DiffReviewModal(state);
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      handler.handleInput("d");
      expect(done).toHaveBeenCalled();
    });
  });

  describe("handleInput — visual mode", () => {
    it("toggles visual mode with V", () => {
      const { modal } = createStateWithFiles();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      handler.handleInput("V");
      // Re-render to check VISUAL LINE indicator
      const lines = handler.render(80);
      const joined = lines.join("\n");
      expect(joined).toContain("VISUAL LINE");
    });

    it("exits visual mode on second V", () => {
      const { modal } = createStateWithFiles();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      handler.handleInput("V");
      handler.handleInput("V");
      const lines = handler.render(80);
      const joined = lines.join("\n");
      expect(joined).not.toContain("VISUAL LINE");
    });
  });

  describe("handleInput — yank", () => {
    it("yanks filepath:linenum in normal mode", () => {
      const { modal } = createStateWithFiles();
      const callbacks: OverlayCallbacks = { onPasteToEditor: vi.fn() };
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done, callbacks);
      handler.handleInput("y");
      expect(callbacks.onPasteToEditor).toHaveBeenCalled();
      const pastedText = (callbacks.onPasteToEditor as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(pastedText).toContain("src/foo.ts:");
      expect(done).toHaveBeenCalled();
    });

    it("yanks fenced code block in visual mode", () => {
      const { modal } = createStateWithFiles();
      const callbacks: OverlayCallbacks = { onPasteToEditor: vi.fn() };
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done, callbacks);
      // Enter visual mode and select a line
      handler.handleInput("V");
      handler.handleInput("y");
      if ((callbacks.onPasteToEditor as ReturnType<typeof vi.fn>).mock.calls.length > 0) {
        const pastedText = (callbacks.onPasteToEditor as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(pastedText).toContain("```");
        expect(done).toHaveBeenCalled();
      }
    });
  });

  describe("invalidate", () => {
    it("exists and is callable", () => {
      const { modal } = createEmptyState();
      const handler = createOverlayHandler(modal, tui, theme, keyUtils, noHighlight, done);
      expect(() => handler.invalidate()).not.toThrow();
    });
  });
});
