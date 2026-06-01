import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "./loading-spinner";

describe("LoadingSpinner", () => {
  it("renders with default props", () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute("aria-label", "Loading");
  });

  it("renders with sm size variant", () => {
    const { container } = render(<LoadingSpinner size="sm" />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("size-4");
  });

  it("renders with default size variant", () => {
    const { container } = render(<LoadingSpinner size="default" />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("size-6");
  });

  it("renders with lg size variant", () => {
    const { container } = render(<LoadingSpinner size="lg" />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("size-10");
  });

  it("shows label text when provided", () => {
    render(<LoadingSpinner label="Fetching data" />);

    expect(screen.getByText("Fetching data")).toBeInTheDocument();
  });

  it("does not show label text when not provided", () => {
    render(<LoadingSpinner />);

    expect(screen.queryByText("Fetching data")).not.toBeInTheDocument();
  });

  it("uses label as aria-label when provided", () => {
    render(<LoadingSpinner label="Please wait" />);

    const spinner = screen.getByRole("status");
    expect(spinner).toHaveAttribute("aria-label", "Please wait");
  });

  it("falls back to 'Loading' aria-label when no label prop", () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole("status");
    expect(spinner).toHaveAttribute("aria-label", "Loading");
  });

  it("has a screen-reader only 'Loading' text", () => {
    render(<LoadingSpinner />);

    const srOnlyText = screen.getByText("Loading");
    expect(srOnlyText).toHaveClass("sr-only");
  });

  it("applies custom className", () => {
    render(<LoadingSpinner className="my-custom-class" />);

    const spinner = screen.getByRole("status");
    expect(spinner).toHaveClass("my-custom-class");
  });
});
