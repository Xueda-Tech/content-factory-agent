import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopicResultsList } from "./TopicResultsList";
import { MOCK_RESULTS } from "./types";

describe("TopicResultsList", () => {
  // --- Empty state ---

  it("renders empty state when results array is empty", () => {
    render(<TopicResultsList results={[]} />);

    expect(screen.getByText(/暂无结果/)).toBeInTheDocument();
  });

  it("empty state contains helpful guidance text", () => {
    render(<TopicResultsList results={[]} />);

    expect(screen.getByText(/请在上方搜索话题/)).toBeInTheDocument();
  });

  it("does not render result count when results are empty", () => {
    render(<TopicResultsList results={[]} />);

    expect(screen.queryByText(/条结果/)).not.toBeInTheDocument();
  });

  // --- Result count ---

  it("renders singular 'result' count for one result", () => {
    render(<TopicResultsList results={[MOCK_RESULTS[0]]} />);

    expect(screen.getByText("找到 1 条结果")).toBeInTheDocument();
  });

  it("renders plural 'results' count for multiple results", () => {
    render(<TopicResultsList results={MOCK_RESULTS} />);

    expect(screen.getByText(`找到 ${MOCK_RESULTS.length} 条结果`)).toBeInTheDocument();
  });

  // --- Result cards rendering ---

  it("renders all result cards", () => {
    render(<TopicResultsList results={MOCK_RESULTS} />);

    for (const result of MOCK_RESULTS) {
      expect(screen.getByText(result.title)).toBeInTheDocument();
    }
  });

  it("renders each result's snippet", () => {
    render(<TopicResultsList results={MOCK_RESULTS} />);

    for (const result of MOCK_RESULTS) {
      expect(screen.getByText(result.snippet)).toBeInTheDocument();
    }
  });

  it("renders each result's date", () => {
    render(<TopicResultsList results={MOCK_RESULTS} />);

    for (const result of MOCK_RESULTS) {
      expect(screen.getByText(result.date)).toBeInTheDocument();
    }
  });

  it("renders each result's source badge text", () => {
    render(<TopicResultsList results={MOCK_RESULTS} />);

    // Count source badges (there are 3 WeChat + 3 Xiaohongshu in MOCK_RESULTS)
    const wechatBadges = screen.getAllByText("WeChat");
    const xhsBadges = screen.getAllByText("Xiaohongshu");
    expect(wechatBadges.length).toBe(3);
    expect(xhsBadges.length).toBe(3);
  });

  // --- Source badge styling ---

  it("WeChat sources show green badge", () => {
    const wechatOnly = [MOCK_RESULTS[0]]; // source: "WeChat"
    const { container } = render(<TopicResultsList results={wechatOnly} />);

    const badge = container.querySelector(".bg-green-100");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-green-700");
  });

  it("Xiaohongshu sources show rose badge", () => {
    const xhsOnly = [MOCK_RESULTS[1]]; // source: "Xiaohongshu"
    const { container } = render(<TopicResultsList results={xhsOnly} />);

    const badge = container.querySelector(".bg-rose-100");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-rose-700");
  });

  // --- Source badge icons ---

  it("WeChat source badge contains an SVG icon (MessageCircle)", () => {
    const wechatOnly = [MOCK_RESULTS[0]];
    const { container } = render(<TopicResultsList results={wechatOnly} />);

    // The badge span has an inline SVG
    const badge = container.querySelector(".bg-green-100");
    const svg = badge?.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("Xiaohongshu source badge contains an SVG icon (BookOpen)", () => {
    const xhsOnly = [MOCK_RESULTS[1]];
    const { container } = render(<TopicResultsList results={xhsOnly} />);

    const badge = container.querySelector(".bg-rose-100");
    const svg = badge?.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  // --- Selected result ---

  it("selected result gets ring-2 ring-primary class", () => {
    const { container } = render(
      <TopicResultsList results={MOCK_RESULTS} selectedId="1" />
    );

    // The first card should have the ring classes
    const cards = container.querySelectorAll("[class*='ring-2']");
    expect(cards.length).toBeGreaterThanOrEqual(1);
    expect(cards[0].className).toContain("ring-primary");
  });

  it("non-selected results do not have ring-primary class", () => {
    const twoResults = MOCK_RESULTS.slice(0, 2);
    const { container } = render(
      <TopicResultsList results={twoResults} selectedId="1" />
    );

    // There should be only one card with ring-2
    const ringCards = container.querySelectorAll("[class*='ring-2']");
    expect(ringCards.length).toBe(1);
  });

  it("no results are selected when selectedId is null", () => {
    const { container } = render(
      <TopicResultsList results={MOCK_RESULTS} selectedId={null} />
    );

    const ringCards = container.querySelectorAll("[class*='ring-2']");
    expect(ringCards.length).toBe(0);
  });

  it("no results are selected when selectedId is undefined", () => {
    const { container } = render(
      <TopicResultsList results={MOCK_RESULTS} />
    );

    const ringCards = container.querySelectorAll("[class*='ring-2']");
    expect(ringCards.length).toBe(0);
  });

  // --- Click interaction ---

  it("clicking a result card calls onSelect with the result id", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TopicResultsList results={MOCK_RESULTS} onSelect={onSelect} />);

    const title = screen.getByText(MOCK_RESULTS[0].title);
    await user.click(title.closest("[class*='cursor-pointer']")!);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("1");
  });

  it("clicking a different result card calls onSelect with that id", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TopicResultsList results={MOCK_RESULTS} onSelect={onSelect} />);

    const title = screen.getByText(MOCK_RESULTS[2].title);
    await user.click(title.closest("[class*='cursor-pointer']")!);

    expect(onSelect).toHaveBeenCalledWith("3");
  });

  it("does not throw when onSelect is not provided", async () => {
    const user = userEvent.setup();
    render(<TopicResultsList results={MOCK_RESULTS} />);

    const title = screen.getByText(MOCK_RESULTS[0].title);
    // Should not throw
    await user.click(title.closest("[class*='cursor-pointer']")!);
  });

  // --- Accessibility ---

  it("result cards have cursor-pointer class for visual affordance", () => {
    const { container } = render(
      <TopicResultsList results={[MOCK_RESULTS[0]]} />
    );

    const card = container.querySelector("[class*='cursor-pointer']");
    expect(card).toBeInTheDocument();
  });
});
