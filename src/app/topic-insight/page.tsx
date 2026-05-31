"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { TopicSearchBar } from "@/components/topic/TopicSearchBar";
import { TopicResultsList } from "@/components/topic/TopicResultsList";
import { TopicAnalysisPanel } from "@/components/topic/TopicAnalysisPanel";
import {
  MOCK_RESULTS,
  MOCK_ANALYSIS,
  type SourceFilter,
} from "@/components/topic/types";

export default function TopicInsightPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filter results based on source (mock: show all by default)
  const [activeFilter, setActiveFilter] = useState<SourceFilter>("all");

  const filteredResults =
    activeFilter === "all"
      ? MOCK_RESULTS
      : MOCK_RESULTS.filter(
          (r) => r.source.toLowerCase() === activeFilter
        );

  const handleSearch = (_query: string, filter: SourceFilter) => {
    setActiveFilter(filter);
    // API integration will go here in a future task
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2">
          <Lightbulb className="size-5 text-amber-500" />
          <h1 className="text-2xl font-bold tracking-tight">Topic Insight</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover trending topics from WeChat and Xiaohongshu. Get AI-powered
          analysis and content recommendations.
        </p>
      </div>

      {/* Search bar */}
      <TopicSearchBar onSearch={handleSearch} />

      {/* Main content: results + analysis */}
      <div className="grid gap-6 lg:grid-cols-[1fr_0.65fr]">
        {/* Results list (~60%) */}
        <TopicResultsList
          results={filteredResults}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {/* Analysis panel (~40%) */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <TopicAnalysisPanel
            analysis={selectedId ? MOCK_ANALYSIS : null}
          />
        </div>
      </div>
    </div>
  );
}
