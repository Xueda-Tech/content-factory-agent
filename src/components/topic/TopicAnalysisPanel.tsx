"use client";

import {
  Lightbulb,
  Compass,
  Monitor,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TopicAnalysis } from "./types";

interface TopicAnalysisPanelProps {
  analysis: TopicAnalysis | null;
}

function AnalysisSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function TopicAnalysisPanel({ analysis }: TopicAnalysisPanelProps) {
  if (!analysis) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">AI 分析</CardTitle>
          </div>
          <CardDescription className="text-xs">
            选择一条话题结果，查看 AI 分析与推荐。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" />
            <CardTitle className="text-sm">AI 分析</CardTitle>
        </div>
        <CardDescription className="text-xs leading-relaxed">
          {analysis.summary}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Key Insights */}
        <AnalysisSection icon={Lightbulb} title="核心洞察">
          <ul className="space-y-2">
            {analysis.keyInsights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <ChevronRight className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">{insight}</span>
              </li>
            ))}
          </ul>
        </AnalysisSection>

        {/* Content Angles */}
        <AnalysisSection icon={Compass} title="内容角度">
          <ul className="space-y-2">
            {analysis.contentAngles.map((angle, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <ChevronRight className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">{angle}</span>
              </li>
            ))}
          </ul>
        </AnalysisSection>

        {/* Recommended Platforms */}
        <AnalysisSection icon={Monitor} title="推荐平台">
          <div className="space-y-2">
            {analysis.recommendedPlatforms.map((platform, i) => (
              <div
                key={i}
                className="rounded-lg bg-muted/50 p-2.5"
              >
                <p className="text-xs font-medium">{platform.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {platform.reason}
                </p>
              </div>
            ))}
          </div>
        </AnalysisSection>
      </CardContent>
    </Card>
  );
}
