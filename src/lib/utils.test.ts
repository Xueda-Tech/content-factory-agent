import { cn } from "./utils";

describe("cn utility", () => {
  it("joins multiple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filters out undefined values", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
  });

  it("merges conflicting Tailwind classes (keeps the last)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles a single class name", () => {
    expect(cn("text-center")).toBe("text-center");
  });

  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("handles conditional classes with falsy values", () => {
    expect(cn("base", false && "hidden", null, "end")).toBe("base end");
  });

  it("merges multiple conflicting Tailwind utilities", () => {
    expect(cn("text-sm text-red-500", "text-lg text-blue-500")).toBe(
      "text-lg text-blue-500",
    );
  });
});
