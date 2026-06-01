import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { AIError, AIAPIError, AIRequestError } from "@/lib/ai";

// Mock the ai module
vi.mock("@/lib/ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai")>();
  return {
    ...actual,
    analyzeTopic: vi.fn(),
  };
});

import { POST } from "@/app/api/topic/analyze/route";
import { analyzeTopic } from "@/lib/ai";

const mockAnalyzeTopic = vi.mocked(analyzeTopic);

function createRequest(body: object) {
  return new NextRequest("http://localhost:3000/api/topic/analyze", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const mockAnalysisResult = {
  summary: "Test summary of the topic",
  keyInsights: ["Insight 1", "Insight 2", "Insight 3"],
  contentAngles: ["Angle 1", "Angle 2"],
  trendingScore: 75,
  recommendedPlatforms: [
    { name: "wechat", reason: "Good for long-form" },
    { name: "xiaohongshu", reason: "Visual-friendly" },
  ],
};

describe("POST /api/topic/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with analysis for valid request", async () => {
    mockAnalyzeTopic.mockResolvedValue(mockAnalysisResult);

    const response = await POST(createRequest({ content: "Some topic content" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockAnalysisResult);
    expect(mockAnalyzeTopic).toHaveBeenCalledWith("Some topic content");
  });

  it("returns 400 when content is missing", async () => {
    const response = await POST(createRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("content must be a non-empty string");
    expect(mockAnalyzeTopic).not.toHaveBeenCalled();
  });

  it("returns 400 when content is empty string", async () => {
    const response = await POST(createRequest({ content: "   " }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("content must be a non-empty string");
    expect(mockAnalyzeTopic).not.toHaveBeenCalled();
  });

  it("returns 400 when content is not a string", async () => {
    const response = await POST(createRequest({ content: 123 }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("content must be a non-empty string");
    expect(mockAnalyzeTopic).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON body", async () => {
    const request = new NextRequest("http://localhost:3000/api/topic/analyze", {
      method: "POST",
      body: "not valid json",
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid JSON body");
    expect(mockAnalyzeTopic).not.toHaveBeenCalled();
  });

  it("returns 502 when AIAPIError is thrown", async () => {
    mockAnalyzeTopic.mockRejectedValue(
      new AIAPIError("API returned 503", 503, "Service Unavailable")
    );

    const response = await POST(createRequest({ content: "test content" }));
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe("API returned 503");
  });

  it("returns 504 when AIRequestError is thrown (timeout)", async () => {
    mockAnalyzeTopic.mockRejectedValue(
      new AIRequestError("Request timed out")
    );

    const response = await POST(createRequest({ content: "test content" }));
    const data = await response.json();

    expect(response.status).toBe(504);
    expect(data.error).toBe("Request timed out");
  });

  it("returns 400 when AIError is thrown", async () => {
    mockAnalyzeTopic.mockRejectedValue(
      new AIError("SILICONFLOW_API_KEY environment variable is not set")
    );

    const response = await POST(createRequest({ content: "test content" }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("SILICONFLOW_API_KEY environment variable is not set");
  });

  it("returns 500 for unknown errors", async () => {
    mockAnalyzeTopic.mockRejectedValue(new Error("something unexpected"));

    const response = await POST(createRequest({ content: "test content" }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });

  it("always returns Content-Type application/json", async () => {
    // Test success case
    mockAnalyzeTopic.mockResolvedValue(mockAnalysisResult);
    const successResponse = await POST(createRequest({ content: "test" }));
    expect(successResponse.headers.get("Content-Type")).toBe("application/json");

    // Test error case
    const errorResponse = await POST(createRequest({}));
    expect(errorResponse.headers.get("Content-Type")).toBe("application/json");

    // Test AI error case
    mockAnalyzeTopic.mockRejectedValue(new AIAPIError("fail", 500, "body"));
    const aiErrorResponse = await POST(createRequest({ content: "test" }));
    expect(aiErrorResponse.headers.get("Content-Type")).toBe("application/json");
  });
});
