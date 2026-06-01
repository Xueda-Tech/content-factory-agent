"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Eye, Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamic import to avoid SSR issues with the markdown editor
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type ViewMode = "edit" | "preview";

interface MarkdownEditorProps {
  /** Initial / controlled markdown content. */
  value: string;
  /** Called when the user edits the content. */
  onChange: (value: string) => void;
  /** Optional: reset to the original generated content. */
  onReset?: () => void;
  /** Whether the editor is disabled (e.g. during generation). */
  disabled?: boolean;
  /** Height of the editor area in pixels. Defaults to 400. */
  height?: number;
}

/**
 * Markdown editor with edit / preview toggle.
 *
 * Wraps @uiw/react-md-editor and adds a toolbar with mode switching
 * and an optional "reset to original" action.
 */
export function MarkdownEditor({
  value,
  onChange,
  onReset,
  disabled = false,
  height = 400,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<ViewMode>("edit");

  const handleChange = useCallback(
    (val: string | undefined) => {
      onChange(val ?? "");
    },
    [onChange],
  );

  return (
    <div className="space-y-2" data-color-mode="light">
      {/* Toolbar */}
      <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
        <Button
          variant={mode === "edit" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setMode("edit")}
          disabled={disabled}
          className="h-7 gap-1 text-xs"
        >
          <Pencil className="size-3" />
          Edit
        </Button>
        <Button
          variant={mode === "preview" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setMode("preview")}
          disabled={disabled}
          className="h-7 gap-1 text-xs"
        >
          <Eye className="size-3" />
          Preview
        </Button>

        <div className="flex-1" />

        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={disabled}
            className="h-7 gap-1 text-xs text-muted-foreground"
          >
            <RotateCcw className="size-3" />
            Reset
          </Button>
        )}
      </div>

      {/* Editor / Preview */}
      <MDEditor
        value={value}
        onChange={handleChange}
        height={height}
        preview={mode === "edit" ? "edit" : "preview"}
        visibleDragbar={false}
        hideToolbar
        data-testid="md-editor"
      />
    </div>
  );
}
