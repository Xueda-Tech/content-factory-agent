import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopicSearchBar } from "./TopicSearchBar";

describe("TopicSearchBar", () => {
  // --- Rendering ---

  it("renders a search input with the correct placeholder", () => {
    render(<TopicSearchBar />);

    const input = screen.getByPlaceholderText("搜索话题、关键词或链接...");
    expect(input).toBeInTheDocument();
  });

  it("renders the 搜索 submit button", () => {
    render(<TopicSearchBar />);

    const button = screen.getByRole("button", { name: /搜索/i });
    expect(button).toBeInTheDocument();
  });

  it("renders all three filter buttons: 全部, 微信, 小红书", () => {
    render(<TopicSearchBar />);

    expect(screen.getByRole("button", { name: "全部" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "微信" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "小红书" })).toBeInTheDocument();
  });

  it("renders a form element", () => {
    const { container } = render(<TopicSearchBar />);

    const form = container.querySelector("form");
    expect(form).toBeInTheDocument();
  });

  // --- Default state ---

  it("defaults the filter to '全部' (highlighted)", () => {
    render(<TopicSearchBar />);

    const allButton = screen.getByRole("button", { name: "全部" });
    // The active filter gets bg-primary class
    expect(allButton.className).toContain("bg-primary");
  });

  it("non-default filter buttons do not have bg-primary class", () => {
    render(<TopicSearchBar />);

    const wechatButton = screen.getByRole("button", { name: "微信" });
    const xhsButton = screen.getByRole("button", { name: "小红书" });

    expect(wechatButton.className).not.toContain("bg-primary");
    expect(xhsButton.className).not.toContain("bg-primary");
  });

  it("search input starts with empty value", () => {
    render(<TopicSearchBar />);

    const input = screen.getByPlaceholderText("搜索话题、关键词或链接...");
    expect(input).toHaveValue("");
  });

  // --- User interactions: filter buttons ---

  it("clicking '微信' filter makes it active", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBar />);

    const wechatButton = screen.getByRole("button", { name: "微信" });
    await user.click(wechatButton);

    expect(wechatButton.className).toContain("bg-primary");
  });

  it("clicking '微信' deactivates the '全部' filter", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBar />);

    await user.click(screen.getByRole("button", { name: "微信" }));

    const allButton = screen.getByRole("button", { name: "全部" });
    expect(allButton.className).not.toContain("bg-primary");
  });

  it("clicking '小红书' filter makes it active", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBar />);

    const xhsButton = screen.getByRole("button", { name: "小红书" });
    await user.click(xhsButton);

    expect(xhsButton.className).toContain("bg-primary");
  });

  it("can switch back to '全部' after selecting another filter", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBar />);

    await user.click(screen.getByRole("button", { name: "微信" }));
    await user.click(screen.getByRole("button", { name: "全部" }));

    expect(screen.getByRole("button", { name: "全部" }).className).toContain("bg-primary");
    expect(screen.getByRole("button", { name: "微信" }).className).not.toContain("bg-primary");
  });

  // --- User interactions: typing ---

  it("updates input value when user types", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBar />);

    const input = screen.getByPlaceholderText("搜索话题、关键词或链接...");
    await user.type(input, "AI marketing");

    expect(input).toHaveValue("AI marketing");
  });

  // --- Form submission ---

  it("calls onSearch with query and current filter on form submit", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<TopicSearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText("搜索话题、关键词或链接...");
    await user.type(input, "content strategy");
    await user.click(screen.getByRole("button", { name: /搜索/i }));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("content strategy", "all");
  });

  it("calls onSearch with the selected filter", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<TopicSearchBar onSearch={onSearch} />);

    await user.click(screen.getByRole("button", { name: "微信" }));

    const input = screen.getByPlaceholderText("搜索话题、关键词或链接...");
    await user.type(input, "test");
    await user.click(screen.getByRole("button", { name: /搜索/i }));

    expect(onSearch).toHaveBeenCalledWith("test", "wechat");
  });

  it("calls onSearch with empty query when submitted without typing", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<TopicSearchBar onSearch={onSearch} />);

    await user.click(screen.getByRole("button", { name: /搜索/i }));

    expect(onSearch).toHaveBeenCalledWith("", "all");
  });

  it("does not throw when onSearch is not provided", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBar />);

    const input = screen.getByPlaceholderText("搜索话题、关键词或链接...");
    await user.type(input, "test");

    // Should not throw
    await user.click(screen.getByRole("button", { name: /搜索/i }));
  });

  // --- Accessibility ---

  it("search input is focusable", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBar />);

    await user.tab();
    const input = screen.getByPlaceholderText("搜索话题、关键词或链接...");
    expect(input).toHaveFocus();
  });

  it("filter buttons are type='button' to prevent form submission", () => {
    render(<TopicSearchBar />);

    const allButton = screen.getByRole("button", { name: "全部" });
    const wechatButton = screen.getByRole("button", { name: "微信" });
    const xhsButton = screen.getByRole("button", { name: "小红书" });

    expect(allButton).toHaveAttribute("type", "button");
    expect(wechatButton).toHaveAttribute("type", "button");
    expect(xhsButton).toHaveAttribute("type", "button");
  });

  it("search button is type='submit'", () => {
    render(<TopicSearchBar />);

    const searchButton = screen.getByRole("button", { name: /搜索/i });
    expect(searchButton).toHaveAttribute("type", "submit");
  });
});
