import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPickerHandler, PickerItem, PickerCallbacks } from "../src/picker";
import { OverlayTui, OverlayTheme, OverlayKeyUtils } from "../src/overlay";

// --- Test helpers ---

function createMockTui(height = 40): OverlayTui {
  return { height, requestRender: vi.fn() };
}

function createMockTheme(): OverlayTheme {
  return {
    fg: (_role: string, text: string) => text,
    bold: (text: string) => `**${text}**`,
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
    truncateToWidth: (text: string, width: number) => {
      if (text.length <= width) {
        return text + " ".repeat(width - text.length);
      }
      return text.slice(0, width);
    },
  };
}

describe("createPickerHandler", () => {
  let tui: OverlayTui;
  let theme: OverlayTheme;
  let keyUtils: OverlayKeyUtils;
  let onSelect: ReturnType<typeof vi.fn>;
  let onCancel: ReturnType<typeof vi.fn>;
  let callbacks: PickerCallbacks;

  beforeEach(() => {
    tui = createMockTui();
    theme = createMockTheme();
    keyUtils = createMockKeyUtils();
    onSelect = vi.fn();
    onCancel = vi.fn();
    callbacks = { onSelect, onCancel };
  });

  describe("render", () => {
    it("renders title", () => {
      const items: PickerItem[] = [];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      const lines = handler.render(80);
      const joined = lines.join("\n");
      expect(joined).toContain("Select");
    });

    it("renders custom title", () => {
      const items: PickerItem[] = [];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks, { title: "Choose File" });
      const lines = handler.render(80);
      const joined = lines.join("\n");
      expect(joined).toContain("Choose File");
    });

    it("renders items with labels", () => {
      const items: PickerItem[] = [
        { id: "1", label: "Item One" },
        { id: "2", label: "Item Two" },
        { id: "3", label: "Item Three" },
      ];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      const lines = handler.render(80);
      const joined = lines.join("\n");
      expect(joined).toContain("Item One");
      expect(joined).toContain("Item Two");
      expect(joined).toContain("Item Three");
    });

    it("renders cursor on first item", () => {
      const items: PickerItem[] = [
        { id: "1", label: "Item One" },
        { id: "2", label: "Item Two" },
      ];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      const lines = handler.render(80);
      const joined = lines.join("\n");
      // First item should be selected (bolded)
      expect(joined).toContain("**> Item One**");
      // Second item should not be selected
      expect(joined).toContain("  Item Two");
    });

    it("renders meta right-aligned", () => {
      const items: PickerItem[] = [
        { id: "1", label: "file.txt", meta: "+10/-5" },
      ];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      const lines = handler.render(80);
      const joined = lines.join("\n");
      expect(joined).toContain("file.txt");
      expect(joined).toContain("+10/-5");
    });

    it("renders description on second line", () => {
      const items: PickerItem[] = [
        { id: "1", label: "Item One", description: "This is a description" },
      ];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      const lines = handler.render(80);
      const joined = lines.join("\n");
      expect(joined).toContain("Item One");
      expect(joined).toContain("This is a description");
    });

    it("shows No items for empty list", () => {
      const items: PickerItem[] = [];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      const lines = handler.render(80);
      const joined = lines.join("\n");
      expect(joined).toContain("No items");
    });

    it("highlights selected item with bold", () => {
      const items: PickerItem[] = [
        { id: "1", label: "First" },
        { id: "2", label: "Second" },
      ];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      const lines = handler.render(80);
      const joined = lines.join("\n");
      // First item should be bold (our mock wraps with **)
      expect(joined).toContain("**> First**");
      // Second should not be bold
      expect(joined).toContain("  Second");
      expect(joined).not.toContain("**Second**");
    });
  });

  describe("input handling", () => {
    it("j moves cursor down", () => {
      const items: PickerItem[] = [
        { id: "1", label: "First" },
        { id: "2", label: "Second" },
      ];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      
      const before = handler.render(80).join("\n");
      expect(before).toContain("**> First**");
      
      handler.handleInput("j");
      
      const after = handler.render(80).join("\n");
      expect(after).not.toContain("**> First**");
      expect(after).toContain("**> Second**");
    });

    it("k moves cursor up", () => {
      const items: PickerItem[] = [
        { id: "1", label: "First" },
        { id: "2", label: "Second" },
      ];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      
      // Move down first
      handler.handleInput("j");
      const before = handler.render(80).join("\n");
      expect(before).toContain("**> Second**");
      
      // Move back up
      handler.handleInput("k");
      const after = handler.render(80).join("\n");
      expect(after).toContain("**> First**");
    });

    it("down arrow moves cursor down", () => {
      const items: PickerItem[] = [
        { id: "1", label: "First" },
        { id: "2", label: "Second" },
      ];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      
      handler.handleInput("DOWN");
      
      const after = handler.render(80).join("\n");
      expect(after).toContain("**> Second**");
    });

    it("up arrow moves cursor up", () => {
      const items: PickerItem[] = [
        { id: "1", label: "First" },
        { id: "2", label: "Second" },
      ];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      
      handler.handleInput("j");
      handler.handleInput("UP");
      
      const after = handler.render(80).join("\n");
      expect(after).toContain("**> First**");
    });

    it("Enter calls onSelect with correct item", () => {
      const items: PickerItem[] = [
        { id: "1", label: "First" },
        { id: "2", label: "Second" },
      ];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      
      handler.handleInput("ENTER");
      
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(items[0]);
    });

    it("Enter selects correct item after navigation", () => {
      const items: PickerItem[] = [
        { id: "1", label: "First" },
        { id: "2", label: "Second" },
      ];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      
      handler.handleInput("j");
      handler.handleInput("ENTER");
      
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(items[1]);
    });

    it("q calls onCancel", () => {
      const items: PickerItem[] = [{ id: "1", label: "First" }];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      
      handler.handleInput("q");
      
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("Escape calls onCancel", () => {
      const items: PickerItem[] = [{ id: "1", label: "First" }];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      
      handler.handleInput("ESC");
      
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("cursor clamps at bottom", () => {
      const items: PickerItem[] = [
        { id: "1", label: "First" },
        { id: "2", label: "Second" },
      ];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      
      handler.handleInput("j");
      handler.handleInput("j");
      handler.handleInput("j"); // Should stay on Second
      
      const after = handler.render(80).join("\n");
      expect(after).toContain("**> Second**");
    });

    it("cursor clamps at top", () => {
      const items: PickerItem[] = [
        { id: "1", label: "First" },
        { id: "2", label: "Second" },
      ];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      
      handler.handleInput("k");
      handler.handleInput("k"); // Should stay on First
      
      const after = handler.render(80).join("\n");
      expect(after).toContain("**> First**");
    });

    it("handleInput returns true for handled keys", () => {
      const items: PickerItem[] = [{ id: "1", label: "First" }];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      
      expect(handler.handleInput("j")).toBe(true);
      expect(handler.handleInput("k")).toBe(true);
      expect(handler.handleInput("UP")).toBe(true);
      expect(handler.handleInput("DOWN")).toBe(true);
      expect(handler.handleInput("ENTER")).toBe(true);
      expect(handler.handleInput("q")).toBe(true);
      expect(handler.handleInput("ESC")).toBe(true);
    });

    it("handleInput returns false for unhandled keys", () => {
      const items: PickerItem[] = [{ id: "1", label: "First" }];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      
      expect(handler.handleInput("x")).toBe(false);
      expect(handler.handleInput("a")).toBe(false);
    });

    it("does not call onSelect when list is empty", () => {
      const items: PickerItem[] = [];
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      
      handler.handleInput("ENTER");
      
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe("scrolling", () => {
    it("scrolls when items exceed height", () => {
      const items: PickerItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i + 1}`,
        label: `Item ${i + 1}`,
      }));
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      
      // Initial render should show first items
      const initial = handler.render(80).join("\n");
      expect(initial).toContain("Item 1");
      
      // Navigate down many times
      for (let i = 0; i < 15; i++) {
        handler.handleInput("j");
      }
      
      // Should scroll to show selected item
      const scrolled = handler.render(80).join("\n");
      expect(scrolled).toContain("Item 16");
    });

    it("keeps cursor visible when scrolling down", () => {
      const items: PickerItem[] = Array.from({ length: 30 }, (_, i) => ({
        id: `${i + 1}`,
        label: `Item ${i + 1}`,
      }));
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      
      // Navigate to bottom
      for (let i = 0; i < 29; i++) {
        handler.handleInput("j");
      }
      
      const rendered = handler.render(80).join("\n");
      expect(rendered).toContain("**> Item 30**");
    });

    it("keeps cursor visible when scrolling up", () => {
      const items: PickerItem[] = Array.from({ length: 30 }, (_, i) => ({
        id: `${i + 1}`,
        label: `Item ${i + 1}`,
      }));
      const handler = createPickerHandler(items, tui, theme, keyUtils, callbacks);
      
      // Navigate to bottom
      for (let i = 0; i < 29; i++) {
        handler.handleInput("j");
      }
      
      // Navigate back up
      for (let i = 0; i < 29; i++) {
        handler.handleInput("k");
      }
      
      const rendered = handler.render(80).join("\n");
      expect(rendered).toContain("**> Item 1**");
    });
  });
});
