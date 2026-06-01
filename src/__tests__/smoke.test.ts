import { describe, it, expect } from "vitest";

describe("test infrastructure smoke test", () => {
  it("runs a basic assertion", () => {
    expect(true).toBe(true);
  });

  it("supports jest-dom matchers via setup file", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    expect(div).toBeInTheDocument();
  });

  it("supports DOM manipulation in jsdom", () => {
    const el = document.createElement("span");
    el.textContent = "hello";
    document.body.appendChild(el);
    expect(el).toHaveTextContent("hello");
    expect(document.body.contains(el)).toBe(true);
  });
});
