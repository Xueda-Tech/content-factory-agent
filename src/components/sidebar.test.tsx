import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "./sidebar";

// Mock next/navigation
const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock next/link to render a plain anchor (avoids Next.js runtime requirement)
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  // --- Brand ---

  it("renders the 'Content Factory' brand text", () => {
    render(<Sidebar />);

    expect(screen.getByText("Content Factory")).toBeInTheDocument();
  });

  // --- Navigation links ---

  it("renders all four navigation links", () => {
    render(<Sidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Topic Insight")).toBeInTheDocument();
    expect(screen.getByText("Content Creation")).toBeInTheDocument();
    expect(screen.getByText("Quick Publish")).toBeInTheDocument();
  });

  it("Dashboard link points to '/'", () => {
    render(<Sidebar />);

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveAttribute("href", "/");
  });

  it("Topic Insight link points to '/topic-insight'", () => {
    render(<Sidebar />);

    const link = screen.getByText("Topic Insight").closest("a");
    expect(link).toHaveAttribute("href", "/topic-insight");
  });

  it("Content Creation link points to '/content-create'", () => {
    render(<Sidebar />);

    const link = screen.getByText("Content Creation").closest("a");
    expect(link).toHaveAttribute("href", "/content-create");
  });

  it("Quick Publish link points to '/publish'", () => {
    render(<Sidebar />);

    const link = screen.getByText("Quick Publish").closest("a");
    expect(link).toHaveAttribute("href", "/publish");
  });

  // --- Active route highlighting ---

  // Helper: active links have text-sidebar-accent-foreground (unique to active state)
  const isActive = (el: Element | null | undefined) =>
    el?.className.includes("text-sidebar-accent-foreground") ?? false;

  it("highlights Dashboard when pathname is '/'", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Sidebar />);

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(isActive(dashboardLink)).toBe(true);
  });

  it("Dashboard is NOT highlighted when pathname is '/topic-insight'", () => {
    mockUsePathname.mockReturnValue("/topic-insight");
    render(<Sidebar />);

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink?.className).toContain("text-sidebar-foreground/70");
    expect(isActive(dashboardLink)).toBe(false);
  });

  it("Topic Insight is highlighted when pathname is '/topic-insight'", () => {
    mockUsePathname.mockReturnValue("/topic-insight");
    render(<Sidebar />);

    const link = screen.getByText("Topic Insight").closest("a");
    expect(isActive(link)).toBe(true);
  });

  it("Content Creation is highlighted when pathname is '/content-create'", () => {
    mockUsePathname.mockReturnValue("/content-create");
    render(<Sidebar />);

    const link = screen.getByText("Content Creation").closest("a");
    expect(isActive(link)).toBe(true);
  });

  it("Quick Publish is highlighted when pathname is '/publish'", () => {
    mockUsePathname.mockReturnValue("/publish");
    render(<Sidebar />);

    const link = screen.getByText("Quick Publish").closest("a");
    expect(isActive(link)).toBe(true);
  });

  // --- Exact match for "/" ---

  it("exact match: '/' does NOT match pathname '/dashboard'", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<Sidebar />);

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(isActive(dashboardLink)).toBe(false);
  });

  it("exact match: '/' does NOT match pathname '/anything'", () => {
    mockUsePathname.mockReturnValue("/anything");
    render(<Sidebar />);

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(isActive(dashboardLink)).toBe(false);
  });

  // --- Prefix match for non-root routes ---

  it("prefix match: '/topic-insight' matches '/topic-insight/something'", () => {
    mockUsePathname.mockReturnValue("/topic-insight/something");
    render(<Sidebar />);

    const link = screen.getByText("Topic Insight").closest("a");
    expect(isActive(link)).toBe(true);
  });

  it("prefix match: '/content-create' matches '/content-create/123'", () => {
    mockUsePathname.mockReturnValue("/content-create/123");
    render(<Sidebar />);

    const link = screen.getByText("Content Creation").closest("a");
    expect(isActive(link)).toBe(true);
  });

  it("prefix match: '/publish' matches '/publish/new'", () => {
    mockUsePathname.mockReturnValue("/publish/new");
    render(<Sidebar />);

    const link = screen.getByText("Quick Publish").closest("a");
    expect(isActive(link)).toBe(true);
  });

  // --- Non-active routes get default class ---

  it("non-active routes get text-sidebar-foreground/70 class", () => {
    mockUsePathname.mockReturnValue("/topic-insight");
    render(<Sidebar />);

    // Dashboard, Content Creation, Quick Publish should all be inactive
    const dashboard = screen.getByText("Dashboard").closest("a");
    const contentCreation = screen.getByText("Content Creation").closest("a");
    const quickPublish = screen.getByText("Quick Publish").closest("a");

    expect(dashboard?.className).toContain("text-sidebar-foreground/70");
    expect(isActive(dashboard)).toBe(false);
    expect(contentCreation?.className).toContain("text-sidebar-foreground/70");
    expect(isActive(contentCreation)).toBe(false);
    expect(quickPublish?.className).toContain("text-sidebar-foreground/70");
    expect(isActive(quickPublish)).toBe(false);
  });

  // --- Only one active link at a time ---

  it("only one link is active at a time", () => {
    mockUsePathname.mockReturnValue("/content-create");
    render(<Sidebar />);

    const links = screen.getAllByRole("link");
    const activeLinks = links.filter(
      (link) => link.className.includes("text-sidebar-accent-foreground")
    );

    // Only Content Creation should be active
    expect(activeLinks.length).toBe(1);
    expect(activeLinks[0]).toHaveTextContent("Content Creation");
  });

  // --- Accessibility ---

  it("renders a navigation element", () => {
    const { container } = render(<Sidebar />);

    const nav = container.querySelector("nav");
    expect(nav).toBeInTheDocument();
  });

  it("renders an aside element", () => {
    const { container } = render(<Sidebar />);

    const aside = container.querySelector("aside");
    expect(aside).toBeInTheDocument();
  });
});
