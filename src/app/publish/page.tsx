"use client";

import { useState, useEffect } from "react";
import { Send, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ContentPiece {
  id: number;
  title: string;
  platform: string;
  status: string;
}

interface PublishResult {
  success: boolean;
  message: string;
  externalId?: string;
  url?: string;
}

type Platform = "wechat" | "xiaohongshu";

const STATUS_ICONS = {
  pending: <Clock className="size-4 text-yellow-500" />,
  success: <CheckCircle className="size-4 text-green-500" />,
  failed: <XCircle className="size-4 text-red-500" />,
};

export default function PublishPage() {
  const [contents, setContents] = useState<ContentPiece[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const [platform, setPlatform] = useState<Platform>("wechat");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  useEffect(() => {
    async function fetchContents() {
      try {
        const response = await fetch("/api/content/list");
        if (response.ok) {
          const data = await response.json();
          setContents(data.contents ?? []);
        }
      } catch {
        // Silently handle — content list is optional for now
      } finally {
        setIsLoadingContent(false);
      }
    }
    fetchContents();
  }, []);

  const handlePublish = async () => {
    if (!selectedContentId) return;

    setIsPublishing(true);
    setPublishResult(null);

    try {
      const selected = contents.find(
        (c) => String(c.id) === selectedContentId
      );
      if (!selected) {
        setPublishResult({
          success: false,
          message: "Selected content not found",
        });
        return;
      }

      const endpoint =
        platform === "wechat"
          ? "/api/publish/wechat"
          : "/api/publish/xhs";

      const body =
        platform === "wechat"
          ? {
              contentId: selected.id,
              title: selected.title,
              content: "", // Content body will be fetched server-side
              contentFormat: "markdown",
              articleType: "news",
            }
          : {
              contentId: selected.id,
              title: selected.title,
              content: "",
              images: [],
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setPublishResult({
          success: true,
          message: "Published successfully!",
          externalId: data.externalId,
          url: data.url,
        });
      } else {
        setPublishResult({
          success: false,
          message: data.error ?? "Publishing failed",
        });
      }
    } catch {
      setPublishResult({
        success: false,
        message: "Network error — please try again",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2">
          <Send className="size-5 text-blue-500" />
          <h1 className="text-2xl font-bold tracking-tight">Quick Publish</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Publish your content to WeChat or Xiaohongshu with one click.
        </p>
      </div>

      {/* Publish form */}
      <Card>
        <CardHeader>
          <CardTitle>Publish Content</CardTitle>
          <CardDescription>
            Select a content piece and choose a platform to publish.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content selector */}
          <div className="space-y-2">
            <label
              htmlFor="content-select"
              className="text-sm font-medium leading-none"
            >
              Content
            </label>
            <select
              id="content-select"
              value={selectedContentId}
              onChange={(e) => setSelectedContentId(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <option value="">
                {isLoadingContent
                  ? "Loading content..."
                  : contents.length === 0
                    ? "No content available"
                    : "Select content to publish"}
              </option>
              {contents.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.title ?? `Content #${c.id}`} ({c.platform})
                </option>
              ))}
            </select>
          </div>

          {/* Platform selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Platform</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPlatform("wechat")}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  platform === "wechat"
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                    : "border-input bg-transparent hover:bg-muted"
                }`}
              >
                WeChat
              </button>
              <button
                type="button"
                onClick={() => setPlatform("xiaohongshu")}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  platform === "xiaohongshu"
                    ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                    : "border-input bg-transparent hover:bg-muted"
                }`}
              >
                Xiaohongshu
              </button>
            </div>
          </div>

          {/* Publish button */}
          <Button
            onClick={handlePublish}
            disabled={!selectedContentId || isPublishing}
            className="w-full"
          >
            {isPublishing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Send className="size-4" />
                Publish Now
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Status display */}
      {publishResult && (
        <Card
          className={
            publishResult.success
              ? "ring-green-500/30"
              : "ring-red-500/30"
          }
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              {publishResult.success ? (
                <CheckCircle className="size-5 text-green-500" />
              ) : (
                <XCircle className="size-5 text-red-500" />
              )}
              <CardTitle>
                {publishResult.success ? "Published" : "Failed"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">{publishResult.message}</p>
            {publishResult.url && (
              <a
                href={publishResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                View published content
              </a>
            )}
            {publishResult.externalId && (
              <p className="text-xs text-muted-foreground">
                External ID: {publishResult.externalId}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Publish history placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Publishes</CardTitle>
          <CardDescription>
            History of your recent publishing attempts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Publish history will appear here after your first publish.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
