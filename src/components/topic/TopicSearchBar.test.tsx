import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopicSearchBar } from "./TopicSearchBar";

describe("TopicSearchBar", () => {
  // --- Rendering ---

  it("renders a search input with the correct placeholder", () => {
    render(<TopicSearchBar />);

    const input = screen.getByPlaceholderText("Search topics, keywords, or URLs...");
    expect(input).toBeInTheDocument();
  });

  it("renders the Search submit button", () => {
    render(<TopicSearchBar />);

    const button = screen.getByRole("button", { name: /search/i });
    expect(button).toBeInTheDocument();
  });

  it("renders all three filter buttons: All, WeChat, Xiaohongshu", () => {
    render(<TopicSearchBar />);

    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "WeChat" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xiaohongshu" })).toBeInTheDocument();
  });

  it("renders a form element", () => {
    const { container } = render(<TopicSearchBar />);

    const form = container.querySelector("form");
    expect(form).toBeInTheDocument();
  });

  // --- Default state ---

  it("defaults the filter to 'All' (highlighted)", () => {
    render(<TopicSearchBar />);

    const allButton = screen.getByRole("button", { name: "All" });
    // The active filter gets bg-primary class
    expect(allButton.className).toContain("bg-primary");
  });

  it("non-default filter buttons do not have bg-primary class", () => {
    render(<TopicSearchBar />);

    const wechatButton = screen.getByRole("button", { name: "WeChat" });
    const xhsButton = screen.getByRole("button", { name: "Xiaohongshu" });

    expect(wechatButton.className).not.toContain("bg-primary");
    expect(xhsButton.className).not.toContain("bg-primary");
  });

  it("search input starts with empty value", () => {
    render(<TopicSearchBar />);

    const input = screen.getByPlaceholderText("Search topics, keywords, or URLs...");
    expect(input).toHaveValue("");
  });

  // --- User interactions: filter buttons ---

  it("clicking 'WeChat' filter makes it active", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBar />);

    const wechatButton = screen.getByRole("button", { name: "WeChat" });
    await user.click(wechatButton);

    expect(wechatButton.className).toContain("bg-primary");
  });

  it("clicking 'WeChat' deactivates the 'All' filter", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBar />);

    await user.click(screen.getByRole("button", { name: "WeChat" }));

    const allButton = screen.getByRole("button", { name: "All" });
    expect(allButton.className).not.toContain("bg-primary");
  });

  it("clicking 'Xiaohongshu' filter makes it active", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBar />);

    const xhsButton = screen.getByRole("button", { name: "Xiaohongshu" });
    await user.click(xhsButton);

    expect(xhsButton.className).toContain("bg-primary");
  });

  it("can switch back to 'All' after selecting another filter", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBar />);

    await user.click(screen.getByRole("button", { name: "WeChat" }));
    await user.click(screen.getByRole("button", { name: "All" }));

    expect(screen.getByRole("button", { name: "All" }).className).toContain("bg-primary");
    expect(screen.getByRole("button", { name: "WeChat" }).className).not.toContain("bg-primary");
  });

  // --- User interactions: typing ---

  it("updates input value when user types", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBar />);

    const input = screen.getByPlaceholderText("Search topics, keywords, or URLs...");
    await user.type(input, "AI marketing");

    expect(input).toHaveValue("AI marketing");
  });

  // --- Form submission ---

  it("calls onSearch with query and current filter on form submit", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<TopicSearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText("Search topics, keywords, or URLs...");
    await user.type(input, "content strategy");
    await user.click(screen.getByRole("button", { name: /search/i }));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("content strategy", "all");
  });

  it("calls onSearch with the selected filter", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<TopicSearchBar onSearch={onSearch} />);

    await user.click(screen.getByRole("button", { name: "WeChat" }));

    const input = screen.getByPlaceholderText("Search topics, keywords, or URLs...");
    await user.type(input, "test");
    await user.click(screen.getByRole("button", { name: /search/i }));

    expect(onSearch).toHaveBeenCalledWith("test", "wechat");
  });

  it("calls onSearch with empty query when submitted without typing", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<TopicSearchBar onSearch={onSearch} />);

    await user.click(screen.getByRole("button", { name: /search/i }));

    expect(onSearch).toHaveBeenCalledWith("", "all");
  });

  it("does not throw when onSearch is not provided", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBar />);

    const input = screen.getByPlaceholderText("Search topics, keywords, or URLs...");
    await user.type(input, "test");

    // Should not throw
    await user.click(screen.getByRole("button", { name: /search/i }));
  });

  // --- Accessibility ---

  it("search input is focusable", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBar />);

    await user.tab();
    const input = screen.getByPlaceholderText("Search topics, keywords, or URLs...");
    expect(input).toHaveFocus();
  });

  it("filter buttons are type='button' to prevent form submission", () => {
    render(<TopicSearchBar />);

    const allButton = screen.getByRole("button", { name: "All" });
    const wechatButton = screen.getByRole("button", { name: "WeChat" });
    const xhsButton = screen.getByRole("button", { name: "Xiaohongshu" });

    expect(allButton).toHaveAttribute("type", "button");
    expect(wechatButton).toHaveAttribute("type", "button");
    expect(xhsButton).toHaveAttribute("type", "button");
  });

  it("search button is type='submit'", () => {
    render(<TopicSearchBar />);

    const searchButton = screen.getByRole("button", { name: /search/i });
    expect(searchButton).toHaveAttribute("type", "submit");
  });
});
