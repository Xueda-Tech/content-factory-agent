import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MarkdownEditor } from "./MarkdownEditor";

// Mock @uiw/react-md-editor — provide a simple controlled textarea stand-in
vi.mock("@uiw/react-md-editor", () => {
  return {
    default: ({
      value,
      onChange,
      preview,
      height,
      ...rest
    }: {
      value: string;
      onChange: (val: string | undefined) => void;
      preview: string;
      height: number;
      [key: string]: unknown;
    }) => (
      <div data-testid="md-editor-mock" data-preview={preview} data-height={height}>
        <textarea
          data-testid="md-editor-textarea"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        />
      </div>
    ),
  };
});

// Mock next/dynamic to simply return the component factory result
vi.mock("next/dynamic", () => {
  return {
    default: (factory: () => Promise<{ default: React.ComponentType }>) => {
      // We already mocked @uiw/react-md-editor, so factory() resolves immediately
      // But dynamic is sync in our mock — just return the mock component directly
      const MockMDEditor = (props: Record<string, unknown>) => {
        const { value, onChange, preview, height, ...rest } = props as {
          value: string;
          onChange: (val: string | undefined) => void;
          preview: string;
          height: number;
          [key: string]: unknown;
        };
        return (
          <div data-testid="md-editor-mock" data-preview={preview} data-height={height}>
            <textarea
              data-testid="md-editor-textarea"
              value={value}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                onChange(e.target.value)
              }
            />
          </div>
        );
      };
      return MockMDEditor;
    },
  };
});

describe("MarkdownEditor", () => {
  const defaultProps = {
    value: "# Hello World",
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  it("renders the editor wrapper", () => {
    render(<MarkdownEditor {...defaultProps} />);

    expect(screen.getByTestId("md-editor-mock")).toBeInTheDocument();
  });

  it("renders Edit button", () => {
    render(<MarkdownEditor {...defaultProps} />);

    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });

  it("renders Preview button", () => {
    render(<MarkdownEditor {...defaultProps} />);

    expect(screen.getByRole("button", { name: /preview/i })).toBeInTheDocument();
  });

  // --- Default mode ---

  it("defaults to edit mode", () => {
    render(<MarkdownEditor {...defaultProps} />);

    const editor = screen.getByTestId("md-editor-mock");
    expect(editor).toHaveAttribute("data-preview", "edit");
  });

  it("Edit button has secondary variant in edit mode (active)", () => {
    render(<MarkdownEditor {...defaultProps} />);

    const editBtn = screen.getByRole("button", { name: /edit/i });
    // In edit mode, Edit gets "secondary" variant, Preview gets "ghost"
    expect(editBtn.className).toContain("secondary");
  });

  // --- Mode switching ---

  it("clicking Preview switches to preview mode", async () => {
    const user = userEvent.setup();
    render(<MarkdownEditor {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /preview/i }));

    const editor = screen.getByTestId("md-editor-mock");
    expect(editor).toHaveAttribute("data-preview", "preview");
  });

  it("clicking Edit switches back to edit mode from preview", async () => {
    const user = userEvent.setup();
    render(<MarkdownEditor {...defaultProps} />);

    // Switch to preview
    await user.click(screen.getByRole("button", { name: /preview/i }));
    expect(screen.getByTestId("md-editor-mock")).toHaveAttribute("data-preview", "preview");

    // Switch back to edit
    await user.click(screen.getByRole("button", { name: /edit/i }));
    expect(screen.getByTestId("md-editor-mock")).toHaveAttribute("data-preview", "edit");
  });

  it("Preview button has secondary variant in preview mode (active)", async () => {
    const user = userEvent.setup();
    render(<MarkdownEditor {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /preview/i }));

    const previewBtn = screen.getByRole("button", { name: /preview/i });
    expect(previewBtn.className).toContain("secondary");
  });

  // --- Reset button ---

  it("shows Reset button when onReset prop is provided", () => {
    render(<MarkdownEditor {...defaultProps} onReset={vi.fn()} />);

    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("does not show Reset button when onReset prop is not provided", () => {
    render(<MarkdownEditor {...defaultProps} />);

    expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument();
  });

  it("calls onReset when Reset button is clicked", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<MarkdownEditor {...defaultProps} onReset={onReset} />);

    await user.click(screen.getByRole("button", { name: /reset/i }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  // --- onChange ---

  it("calls onChange when content changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MarkdownEditor value="" onChange={onChange} />);

    const textarea = screen.getByTestId("md-editor-textarea");
    await user.type(textarea, "new content");

    // user.type types one character at a time, so onChange is called per character
    expect(onChange).toHaveBeenCalled();
  });

  it("passes value through to the editor", () => {
    render(<MarkdownEditor value="test markdown" onChange={vi.fn()} />);

    const textarea = screen.getByTestId("md-editor-textarea");
    expect(textarea).toHaveValue("test markdown");
  });

  // --- Disabled state ---

  it("disables Edit button when disabled prop is true", () => {
    render(<MarkdownEditor {...defaultProps} disabled />);

    const editBtn = screen.getByRole("button", { name: /edit/i });
    expect(editBtn).toBeDisabled();
  });

  it("disables Preview button when disabled prop is true", () => {
    render(<MarkdownEditor {...defaultProps} disabled />);

    const previewBtn = screen.getByRole("button", { name: /preview/i });
    expect(previewBtn).toBeDisabled();
  });

  it("disables Reset button when disabled prop is true", () => {
    render(<MarkdownEditor {...defaultProps} onReset={vi.fn()} disabled />);

    const resetBtn = screen.getByRole("button", { name: /reset/i });
    expect(resetBtn).toBeDisabled();
  });

  it("buttons are NOT disabled when disabled is false (default)", () => {
    render(<MarkdownEditor {...defaultProps} />);

    const editBtn = screen.getByRole("button", { name: /edit/i });
    const previewBtn = screen.getByRole("button", { name: /preview/i });

    expect(editBtn).not.toBeDisabled();
    expect(previewBtn).not.toBeDisabled();
  });

  it("does not switch mode when buttons are disabled", async () => {
    const user = userEvent.setup();
    render(<MarkdownEditor {...defaultProps} disabled />);

    // Buttons are disabled, so clicking should not change mode
    const previewBtn = screen.getByRole("button", { name: /preview/i });
    await user.click(previewBtn);

    // Should still be in edit mode
    expect(screen.getByTestId("md-editor-mock")).toHaveAttribute("data-preview", "edit");
  });

  // --- Height prop ---

  it("passes height prop to the editor", () => {
    render(<MarkdownEditor {...defaultProps} height={600} />);

    const editor = screen.getByTestId("md-editor-mock");
    expect(editor).toHaveAttribute("data-height", "600");
  });

  it("defaults height to 400 when not specified", () => {
    render(<MarkdownEditor {...defaultProps} />);

    const editor = screen.getByTestId("md-editor-mock");
    expect(editor).toHaveAttribute("data-height", "400");
  });

  // --- Accessibility ---

  it("toolbar buttons are keyboard-focusable", async () => {
    const user = userEvent.setup();
    render(<MarkdownEditor {...defaultProps} />);

    // Tab to the first button (Edit)
    await user.tab();
    expect(screen.getByRole("button", { name: /edit/i })).toHaveFocus();
  });
});
