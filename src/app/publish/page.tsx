"use client";

import { useState, useEffect, useRef } from "react";
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
  body?: string;
}

interface PublishResult {
  success: boolean;
  message: string;
  externalId?: string;
  url?: string;
}

interface PublishHistoryEntry {
  id: number;
  content_id: number;
  platform: string;
  external_id: string | null;
  url: string | null;
  status: string;
  response: string | null;
  published_at: string;
  title: string | null;
}

type Platform = "wechat" | "xiaohongshu";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="size-4 text-yellow-500" />,
  success: <CheckCircle className="size-4 text-green-500" />,
  failed: <XCircle className="size-4 text-red-500" />,
};

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr + "Z"); // SQLite stores UTC
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "刚刚";
    if (diffMin < 60) return `${diffMin} 分钟前`;
    if (diffHr < 24) return `${diffHr} 小时前`;
    if (diffDay < 7) return `${diffDay} 天前`;
    return date.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

export default function PublishPage() {
  const [contents, setContents] = useState<ContentPiece[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const [platform, setPlatform] = useState<Platform>("wechat");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [publishHistory, setPublishHistory] = useState<PublishHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

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

  // Use a ref so the refresh button can trigger re-fetch without re-render loops
  const fetchHistoryRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      try {
        setIsLoadingHistory(true);
        const response = await fetch("/api/publish/history?limit=10");
        if (response.ok && !cancelled) {
          const data = await response.json();
          setPublishHistory(data.history ?? []);
        }
      } catch {
        // Silently handle
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    }
    loadHistory();
    fetchHistoryRef.current = loadHistory;
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePublish = async () => {
    if (!selectedContentId) return;

    setIsPublishing(true);
    setPublishResult(null);

    try {
      const selected = contents.find(
        (c) => String(c.id) === selectedContentId,
      );
      if (!selected) {
        setPublishResult({
          success: false,
          message: "未找到所选内容",
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
              content: "", // Server will look up content by contentId
              contentFormat: "markdown",
              articleType: "news",
            }
          : {
              contentId: selected.id,
              title: selected.title,
              content: "", // Server will look up content by contentId
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
          message: "发布成功！",
          externalId: data.externalId,
          url: data.url,
        });
        // Refresh history after successful publish
        fetchHistoryRef.current();
      } else {
        setPublishResult({
          success: false,
          message: data.error ?? "发布失败",
        });
      }
    } catch {
      setPublishResult({
        success: false,
          message: "网络错误，请重试",
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
          <h1 className="text-2xl font-bold tracking-tight">快速发布</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          一键将内容发布到微信公众号或小红书。
        </p>
      </div>

      {/* Publish form */}
      <Card>
        <CardHeader>
          <CardTitle>发布内容</CardTitle>
          <CardDescription>
            选择一篇内容和目标平台进行发布。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content selector */}
          <div className="space-y-2">
            <label
              htmlFor="content-select"
              className="text-sm font-medium leading-none"
            >
              内容
            </label>
            <select
              id="content-select"
              value={selectedContentId}
              onChange={(e) => setSelectedContentId(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <option value="">
                {isLoadingContent
                  ? "加载中..."
                  : contents.length === 0
                    ? "暂无可用内容"
                    : "选择要发布的内容"}
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
            <label className="text-sm font-medium leading-none">平台</label>
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
                发布中...
              </>
            ) : (
              <>
                <Send className="size-4" />
                立即发布
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
                {publishResult.success ? "发布成功" : "发布失败"}
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
                外部 ID: {publishResult.externalId}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Publish history */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>发布历史</CardTitle>
              <CardDescription>
                最近的发布记录。
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchHistoryRef.current()}
              disabled={isLoadingHistory}
            >
              {isLoadingHistory ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "刷新"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : publishHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              暂无发布记录，请在上方发布第一篇内容。
            </p>
          ) : (
            <div className="space-y-3">
              {publishHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-lg border p-3 text-sm"
                >
                  <div className="mt-0.5">
                    {STATUS_ICONS[entry.status] ?? (
                      <Clock className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">
                        {entry.title ?? `Content #${entry.content_id}`}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(entry.published_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          entry.platform === "wechat"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {entry.platform === "wechat"
                          ? "WeChat"
                          : entry.platform === "xiaohongshu"
                            ? "XHS"
                            : entry.platform}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          entry.status === "success"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : entry.status === "failed"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </div>
                    {entry.url && (
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        查看发布内容
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
