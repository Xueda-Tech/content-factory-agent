import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopicAnalysisPanel } from "./TopicAnalysisPanel";
import { MOCK_ANALYSIS } from "./types";

describe("TopicAnalysisPanel", () => {
  // --- Placeholder state (analysis is null) ---

  it("renders placeholder when analysis is null", () => {
    render(<TopicAnalysisPanel analysis={null} />);

    expect(
      screen.getByText(/select a topic result to view ai-powered analysis/i)
    ).toBeInTheDocument();
  });

  it("renders 'AI Analysis' title in placeholder state", () => {
    render(<TopicAnalysisPanel analysis={null} />);

    expect(screen.getByText("AI Analysis")).toBeInTheDocument();
  });

  it("does not render any sections when analysis is null", () => {
    render(<TopicAnalysisPanel analysis={null} />);

    expect(screen.queryByText("Key Insights")).not.toBeInTheDocument();
    expect(screen.queryByText("Content Angles")).not.toBeInTheDocument();
    expect(screen.queryByText("Recommended Platforms")).not.toBeInTheDocument();
  });

  // --- With analysis data ---

  it("renders the summary text when analysis is provided", () => {
    render(<TopicAnalysisPanel analysis={MOCK_ANALYSIS} />);

    expect(screen.getByText(MOCK_ANALYSIS.summary)).toBeInTheDocument();
  });

  it("renders 'AI Analysis' title when analysis is provided", () => {
    render(<TopicAnalysisPanel analysis={MOCK_ANALYSIS} />);

    expect(screen.getByText("AI Analysis")).toBeInTheDocument();
  });

  // --- Section headers ---

  it("renders 'Key Insights' section header", () => {
    render(<TopicAnalysisPanel analysis={MOCK_ANALYSIS} />);

    expect(screen.getByText("Key Insights")).toBeInTheDocument();
  });

  it("renders 'Content Angles' section header", () => {
    render(<TopicAnalysisPanel analysis={MOCK_ANALYSIS} />);

    expect(screen.getByText("Content Angles")).toBeInTheDocument();
  });

  it("renders 'Recommended Platforms' section header", () => {
    render(<TopicAnalysisPanel analysis={MOCK_ANALYSIS} />);

    expect(screen.getByText("Recommended Platforms")).toBeInTheDocument();
  });

  // --- Key Insights ---

  it("renders all keyInsights items", () => {
    render(<TopicAnalysisPanel analysis={MOCK_ANALYSIS} />);

    for (const insight of MOCK_ANALYSIS.keyInsights) {
      expect(screen.getByText(insight)).toBeInTheDocument();
    }
  });

  it("renders the correct number of keyInsights items", () => {
    render(<TopicAnalysisPanel analysis={MOCK_ANALYSIS} />);

    // Each insight has a ChevronRight icon and text in a list item;
    // verify each unique insight text appears exactly once
    for (const insight of MOCK_ANALYSIS.keyInsights) {
      const matches = screen.getAllByText(insight);
      expect(matches.length).toBe(1);
    }
    // Verify total count matches expected
    expect(MOCK_ANALYSIS.keyInsights.length).toBe(4);
  });

  // --- Content Angles ---

  it("renders all contentAngles items", () => {
    render(<TopicAnalysisPanel analysis={MOCK_ANALYSIS} />);

    for (const angle of MOCK_ANALYSIS.contentAngles) {
      expect(screen.getByText(angle)).toBeInTheDocument();
    }
  });

  it("renders the correct number of contentAngles items", () => {
    render(<TopicAnalysisPanel analysis={MOCK_ANALYSIS} />);

    // Each angle text appears once
    for (const angle of MOCK_ANALYSIS.contentAngles) {
      const elements = screen.getAllByText(angle);
      expect(elements.length).toBe(1);
    }
  });

  // --- Recommended Platforms ---

  it("renders all recommendedPlatforms with name and reason", () => {
    render(<TopicAnalysisPanel analysis={MOCK_ANALYSIS} />);

    for (const platform of MOCK_ANALYSIS.recommendedPlatforms) {
      expect(screen.getByText(platform.name)).toBeInTheDocument();
      expect(screen.getByText(platform.reason)).toBeInTheDocument();
    }
  });

  it("renders platform names as bold/medium font", () => {
    render(<TopicAnalysisPanel analysis={MOCK_ANALYSIS} />);

    for (const platform of MOCK_ANALYSIS.recommendedPlatforms) {
      const nameEl = screen.getByText(platform.name);
      expect(nameEl).toHaveClass("font-medium");
    }
  });

  // --- Edge cases ---

  it("renders correctly with empty arrays", () => {
    const emptyAnalysis = {
      summary: "A brief summary",
      keyInsights: [],
      contentAngles: [],
      recommendedPlatforms: [],
    };

    render(<TopicAnalysisPanel analysis={emptyAnalysis} />);

    expect(screen.getByText("A brief summary")).toBeInTheDocument();
    expect(screen.getByText("Key Insights")).toBeInTheDocument();
    expect(screen.getByText("Content Angles")).toBeInTheDocument();
    expect(screen.getByText("Recommended Platforms")).toBeInTheDocument();
  });

  it("renders correctly with a single item in each array", () => {
    const singleItemAnalysis = {
      summary: "Single item summary",
      keyInsights: ["Only insight"],
      contentAngles: ["Only angle"],
      recommendedPlatforms: [{ name: "Only Platform", reason: "Only reason" }],
    };

    render(<TopicAnalysisPanel analysis={singleItemAnalysis} />);

    expect(screen.getByText("Only insight")).toBeInTheDocument();
    expect(screen.getByText("Only angle")).toBeInTheDocument();
    expect(screen.getByText("Only Platform")).toBeInTheDocument();
    expect(screen.getByText("Only reason")).toBeInTheDocument();
  });

  // --- Accessibility ---

  it("section headers are rendered as h3 elements", () => {
    render(<TopicAnalysisPanel analysis={MOCK_ANALYSIS} />);

    const keyInsights = screen.getByRole("heading", { name: "Key Insights" });
    const contentAngles = screen.getByRole("heading", { name: "Content Angles" });
    const platforms = screen.getByRole("heading", { name: "Recommended Platforms" });

    expect(keyInsights.tagName).toBe("H3");
    expect(contentAngles.tagName).toBe("H3");
    expect(platforms.tagName).toBe("H3");
  });
});
