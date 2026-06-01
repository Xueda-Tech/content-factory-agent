"use client";

import { useState } from "react";
import {
  PenSquare,
  Sparkles,
  Loader2,
  Copy,
  Check,
  MessageSquare,
  Camera,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Types
type Platform = "wechat" | "xiaohongshu" | "twitter";
type Tone = "professional" | "casual" | "humorous";

interface GenerateOptions {
  wordCount: number;
  tone: Tone;
}

// Platform metadata
const PLATFORMS: { id: Platform; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  {
    id: "wechat",
    label: "微信",
    icon: MessageSquare,
    description: "微信公众号长文",
  },
  {
    id: "xiaohongshu",
    label: "小红书",
    icon: Camera,
    description: "带表情和标签的短文",
  },
  {
    id: "twitter",
    label: "Twitter / X",
    icon: Hash,
    description: "长推文格式（3-6 条）",
  },
];

const TONES: { id: Tone; label: string }[] = [
  { id: "professional", label: "专业" },
  { id: "casual", label: "轻松" },
  { id: "humorous", label: "幽默" },
];

export default function ContentCreatePage() {
  // Form state
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<Platform>("wechat");
  const [options, setOptions] = useState<GenerateOptions>({
    wordCount: 800,
    tone: "professional",
  });

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("请输入话题或简要描述。");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedContent(null);

    try {
      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          platform,
          options: {
            wordCount: options.wordCount,
            tone: options.tone,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error ?? `生成失败 (${response.status})`
        );
      }

      const data = await response.json();
      setGeneratedContent(data.content);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "发生未知错误。"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedContent) return;
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

  const selectedPlatform = PLATFORMS.find((p) => p.id === platform);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2">
          <PenSquare className="size-5 text-blue-500" />
          <h1 className="text-2xl font-bold tracking-tight">
            内容创作
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          用 AI 为微信、小红书和 Twitter 生成平台定制内容。
        </p>
      </div>

      {/* Main content: input panel + output */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Left column: Input panel */}
        <div className="space-y-4">
          {/* Topic input */}
          <Card>
            <CardHeader>
              <CardTitle>话题 / 简要描述</CardTitle>
              <CardDescription>
                描述你想写的内容，越具体越好。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例如：AI 内容创作工具在中国社交媒体的崛起..."
                className="min-h-[140px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                disabled={isGenerating}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {topic.length} 个字符
              </p>
            </CardContent>
          </Card>

          {/* Platform selector */}
          <Card>
            <CardHeader>
              <CardTitle>平台</CardTitle>
              <CardDescription>
                选择内容的目标发布平台。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-3">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    disabled={isGenerating}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors ${
                      platform === p.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <p.icon className="size-5" />
                    <span className="text-sm font-medium">{p.label}</span>
                  </button>
                ))}
              </div>
              {selectedPlatform && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {selectedPlatform.description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle>选项</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Word count slider */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">字数</label>
                  <span className="text-sm text-muted-foreground">
                    ~{options.wordCount}
                  </span>
                </div>
                <input
                  type="range"
                  min={200}
                  max={3000}
                  step={100}
                  value={options.wordCount}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      wordCount: Number(e.target.value),
                    }))
                  }
                  disabled={isGenerating}
                  className="mt-2 w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>200</span>
                  <span>3000</span>
                </div>
              </div>

              {/* Tone selector */}
              <div>
                <label className="text-sm font-medium">风格</label>
                <div className="mt-2 flex gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() =>
                        setOptions((prev) => ({ ...prev, tone: t.id }))
                      }
                      disabled={isGenerating}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        options.tone === t.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                生成内容
              </>
            )}
          </Button>

          {/* Error display */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Right column: Output display */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Card className="min-h-[400px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>生成结果</CardTitle>
                  <CardDescription>
                    {generatedContent
                      ? "以下是 AI 生成的内容预览。"
                      : "生成的内容将显示在这里。"}
                  </CardDescription>
                </div>
                {generatedContent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="size-3.5" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        复制
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    正在为{selectedPlatform?.label}生成内容...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    请稍候。
                  </p>
                </div>
              ) : generatedContent ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm leading-relaxed">
                    {generatedContent}
                  </pre>
                </div>
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Sparkles className="size-10 opacity-30" />
                  <p className="text-sm">
                    输入话题并点击「生成内容」开始。
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
