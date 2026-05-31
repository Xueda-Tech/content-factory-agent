"use client";

import { MessageCircle, BookOpen, ExternalLink, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TopicResult } from "./types";

interface TopicResultsListProps {
  results: TopicResult[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

function SourceBadge({ source }: { source: TopicResult["source"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        source === "WeChat"
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
      )}
    >
      {source === "WeChat" ? (
        <MessageCircle className="size-3" />
      ) : (
        <BookOpen className="size-3" />
      )}
      {source}
    </span>
  );
}

function ResultCard({
  result,
  selected,
  onSelect,
}: {
  result: TopicResult;
  selected: boolean;
  onSelect?: (id: string) => void;
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        selected && "ring-2 ring-primary"
      )}
      onClick={() => onSelect?.(result.id)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm leading-snug">{result.title}</CardTitle>
          <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <SourceBadge source={result.source} />
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="size-3" />
            {result.date}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="line-clamp-2 text-xs">
          {result.snippet}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

export function TopicResultsList({
  results,
  selectedId,
  onSelect,
}: TopicResultsListProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No results yet. Try searching for a topic above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {results.length} result{results.length !== 1 ? "s" : ""} found
      </p>
      {results.map((result) => (
        <ResultCard
          key={result.id}
          result={result}
          selected={result.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
