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
    label: "WeChat",
    icon: MessageSquare,
    description: "Long-form article for WeChat Official Account",
  },
  {
    id: "xiaohongshu",
    label: "Xiaohongshu",
    icon: Camera,
    description: "Short-form post with emojis and hashtags",
  },
  {
    id: "twitter",
    label: "Twitter / X",
    icon: Hash,
    description: "Thread format (3-6 tweets)",
  },
];

const TONES: { id: Tone; label: string }[] = [
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
  { id: "humorous", label: "Humorous" },
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
      setError("Please enter a topic or brief.");
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
          data?.error ?? `Generation failed (${response.status})`
        );
      }

      const data = await response.json();
      setGeneratedContent(data.content);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
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
            Content Creation
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate platform-optimized content for WeChat, Xiaohongshu, and
          Twitter using AI.
        </p>
      </div>

      {/* Main content: input panel + output */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Left column: Input panel */}
        <div className="space-y-4">
          {/* Topic input */}
          <Card>
            <CardHeader>
              <CardTitle>Topic / Brief</CardTitle>
              <CardDescription>
                Describe what you want to write about. Be as specific as you
                like.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. The rise of AI-powered content creation tools in China's social media landscape..."
                className="min-h-[140px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                disabled={isGenerating}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {topic.length} characters
              </p>
            </CardContent>
          </Card>

          {/* Platform selector */}
          <Card>
            <CardHeader>
              <CardTitle>Platform</CardTitle>
              <CardDescription>
                Select the target platform for your content.
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
              <CardTitle>Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Word count slider */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Word Count</label>
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
                <label className="text-sm font-medium">Tone</label>
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
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate Content
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
                  <CardTitle>Generated Content</CardTitle>
                  <CardDescription>
                    {generatedContent
                      ? "Preview your generated content below."
                      : "Your generated content will appear here."}
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
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        Copy
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
                    Generating content for {selectedPlatform?.label}...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This may take a moment.
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
                    Enter a topic and click Generate to get started.
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
