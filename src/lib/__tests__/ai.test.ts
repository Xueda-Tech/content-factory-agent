import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid TopicAnalysisResult JSON object. */
function validTopicResult(overrides: Record<string, unknown> = {}) {
  return {
    summary: "A trending AI topic with strong engagement signals.",
    keyInsights: ["Insight one", "Insight two", "Insight three"],
    contentAngles: ["Angle one", "Angle two", "Angle three"],
    trendingScore: 75,
    recommendedPlatforms: [
      { name: "wechat", reason: "Good for long-form" },
      { name: "xiaohongshu", reason: "Visual audience" },
    ],
    ...overrides,
  };
}

/** Create a mock fetch that resolves with a given body and status. */
function mockFetchResolved(body: string, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(JSON.parse(body)),
    text: () => Promise.resolve(body),
  });
}

/** Create a mock fetch that rejects with a given error. */
function mockFetchRejected(error: unknown) {
  return vi.fn().mockRejectedValue(error);
}

/** Create a mock fetch that returns a chat completion wrapping `content`. */
function mockFetchWithContent(content: string, status = 200) {
  const responseBody = JSON.stringify({
    id: "test-id",
    choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
  });
  return mockFetchResolved(responseBody, status);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AI error classes", () => {
  it("AIError sets name, message, and cause", async () => {
    vi.resetModules();
    const { AIError } = await import("../ai");
    const cause = new Error("root");
    const err = new AIError("boom", cause);

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AIError);
    expect(err.name).toBe("AIError");
    expect(err.message).toBe("boom");
    expect(err.cause).toBe(cause);
  });

  it("AIError works without a cause", async () => {
    vi.resetModules();
    const { AIError } = await import("../ai");
    const err = new AIError("no cause");
    expect(err.cause).toBeUndefined();
  });

  it("AIAPIError sets name, statusCode, responseBody, and cause", async () => {
    vi.resetModules();
    const { AIError, AIAPIError } = await import("../ai");
    const cause = new Error("root");
    const err = new AIAPIError("api failed", 500, "Internal Server Error", cause);

    expect(err).toBeInstanceOf(AIError);
    expect(err).toBeInstanceOf(AIAPIError);
    expect(err.name).toBe("AIAPIError");
    expect(err.message).toBe("api failed");
    expect(err.statusCode).toBe(500);
    expect(err.responseBody).toBe("Internal Server Error");
    expect(err.cause).toBe(cause);
  });

  it("AIResponseError sets name and cause", async () => {
    vi.resetModules();
    const { AIResponseError } = await import("../ai");
    const cause = new SyntaxError("bad json");
    const err = new AIResponseError("parse failed", cause);

    expect(err).toBeInstanceOf(AIError);
    expect(err).toBeInstanceOf(AIResponseError);
    expect(err.name).toBe("AIResponseError");
    expect(err.message).toBe("parse failed");
    expect(err.cause).toBe(cause);
  });

  it("AIRequestError sets name and cause", async () => {
    vi.resetModules();
    const { AIRequestError } = await import("../ai");
    const cause = new Error("timeout");
    const err = new AIRequestError("timed out", cause);

    expect(err).toBeInstanceOf(AIError);
    expect(err).toBeInstanceOf(AIRequestError);
    expect(err.name).toBe("AIRequestError");
    expect(err.message).toBe("timed out");
    expect(err.cause).toBe(cause);
  });

  it("all error classes are instanceof Error", async () => {
    vi.resetModules();
    const { AIError, AIAPIError, AIResponseError, AIRequestError } = await import("../ai");

    expect(new AIError("a")).toBeInstanceOf(Error);
    expect(new AIAPIError("b", 500, "")).toBeInstanceOf(Error);
    expect(new AIResponseError("c")).toBeInstanceOf(Error);
    expect(new AIRequestError("d")).toBeInstanceOf(Error);
  });
});

// ===========================================================================

describe("analyzeTopic", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("throws AIError on empty content", async () => {
    const { analyzeTopic, AIError } = await import("../ai");
    await expect(analyzeTopic("")).rejects.toThrow(AIError);
    await expect(analyzeTopic("   ")).rejects.toThrow("Content must not be empty");
  });

  it("throws AIError when SILICONFLOW_API_KEY is not set", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "");
    vi.stubGlobal("fetch", vi.fn());

    const { analyzeTopic, AIError } = await import("../ai");
    await expect(analyzeTopic("some content")).rejects.toThrow(AIError);
    await expect(analyzeTopic("some content")).rejects.toThrow(
      "SILICONFLOW_API_KEY environment variable is not set",
    );
  });

  it("returns parsed TopicAnalysisResult on success", async () => {
    const result = validTopicResult();
    const content = JSON.stringify(result);
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchWithContent(content));

    const { analyzeTopic } = await import("../ai");
    const actual = await analyzeTopic("What is trending in AI?");

    expect(actual).toEqual(result);
    expect(actual.summary).toBe(result.summary);
    expect(actual.keyInsights).toHaveLength(3);
    expect(actual.trendingScore).toBe(75);
  });

  it("handles JSON wrapped in ```json fenced blocks", async () => {
    const result = validTopicResult();
    const fenced = "```json\n" + JSON.stringify(result, null, 2) + "\n```";
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchWithContent(fenced));

    const { analyzeTopic } = await import("../ai");
    const actual = await analyzeTopic("some content");

    expect(actual).toEqual(result);
  });

  it("handles JSON wrapped in plain ``` fenced blocks (no language tag)", async () => {
    const result = validTopicResult();
    const fenced = "```\n" + JSON.stringify(result) + "\n```";
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchWithContent(fenced));

    const { analyzeTopic } = await import("../ai");
    const actual = await analyzeTopic("some content");

    expect(actual).toEqual(result);
  });

  it("handles bare JSON object in the response text", async () => {
    const result = validTopicResult();
    const wrapped = "Here is the analysis:\n" + JSON.stringify(result) + "\nDone.";
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchWithContent(wrapped));

    const { analyzeTopic } = await import("../ai");
    const actual = await analyzeTopic("some content");

    expect(actual).toEqual(result);
  });

  it("throws AIResponseError on unparseable JSON", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchWithContent("this is not json at all"));

    const { analyzeTopic, AIResponseError } = await import("../ai");
    await expect(analyzeTopic("some content")).rejects.toThrow(AIResponseError);
  });

  it("throws AIResponseError when response shape is invalid (missing fields)", async () => {
    const invalid = { summary: "ok" }; // missing keyInsights, etc.
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchWithContent(JSON.stringify(invalid)));

    const { analyzeTopic, AIResponseError } = await import("../ai");
    await expect(analyzeTopic("some content")).rejects.toThrow(AIResponseError);
    await expect(analyzeTopic("some content")).rejects.toThrow(
      "does not match the expected TopicAnalysisResult shape",
    );
  });

  it("throws AIResponseError when trendingScore is out of range (> 100)", async () => {
    const result = validTopicResult({ trendingScore: 150 });
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchWithContent(JSON.stringify(result)));

    const { analyzeTopic, AIResponseError } = await import("../ai");
    await expect(analyzeTopic("some content")).rejects.toThrow(AIResponseError);
  });

  it("throws AIResponseError when trendingScore is negative", async () => {
    const result = validTopicResult({ trendingScore: -10 });
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchWithContent(JSON.stringify(result)));

    const { analyzeTopic, AIResponseError } = await import("../ai");
    await expect(analyzeTopic("some content")).rejects.toThrow(AIResponseError);
  });

  it("accepts trendingScore at boundaries (0 and 100)", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");

    const result0 = validTopicResult({ trendingScore: 0 });
    vi.stubGlobal("fetch", mockFetchWithContent(JSON.stringify(result0)));
    const { analyzeTopic: analyze0 } = await import("../ai");
    await expect(analyze0("content")).resolves.toEqual(result0);

    vi.resetModules();
    const result100 = validTopicResult({ trendingScore: 100 });
    vi.stubGlobal("fetch", mockFetchWithContent(JSON.stringify(result100)));
    const { analyzeTopic: analyze100 } = await import("../ai");
    await expect(analyze100("content")).resolves.toEqual(result100);
  });

  it("throws AIAPIError on non-2xx response (4xx) without retrying", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchResolved("Unauthorized", 401));

    const { analyzeTopic, AIAPIError } = await import("../ai");
    await expect(analyzeTopic("some content")).rejects.toThrow(AIAPIError);

    // Should only be called once (no retry on 4xx)
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("throws AIAPIError on 429 without retrying", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchResolved("Rate limited", 429));

    const { analyzeTopic, AIAPIError } = await import("../ai");
    await expect(analyzeTopic("some content")).rejects.toThrow(AIAPIError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries on 5xx and then throws AIAPIError", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    const failingFetch = mockFetchResolved("Server Error", 500);
    vi.stubGlobal("fetch", failingFetch);

    const { analyzeTopic, AIAPIError } = await import("../ai");

    const promise = analyzeTopic("some content");

    // Advance past retry delays: first attempt is immediate, then 1s, then 2s
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    await expect(promise).rejects.toThrow(AIAPIError);
    // 3 attempts total: initial + 2 retries
    expect(failingFetch).toHaveBeenCalledTimes(3);
  });

  it("throws AIRequestError on timeout (AbortError)", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");

    const abortError = new DOMException("The operation was aborted", "AbortError");
    const timeoutFetch = vi.fn().mockRejectedValue(abortError);
    vi.stubGlobal("fetch", timeoutFetch);

    const { analyzeTopic, AIRequestError } = await import("../ai");

    const promise = analyzeTopic("some content");

    // Advance past all retry delays
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    await expect(promise).rejects.toThrow(AIRequestError);
    await expect(promise).rejects.toThrow("Request failed after 3 attempts");
    // 3 attempts total
    expect(timeoutFetch).toHaveBeenCalledTimes(3);
  });

  it("recovers from transient failure and returns result on second attempt", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");

    const result = validTopicResult();
    const successBody = JSON.stringify({
      id: "test-id",
      choices: [{ index: 0, message: { role: "assistant", content: JSON.stringify(result) }, finish_reason: "stop" }],
    });

    // First call: 500, second call: success
    const flakyFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Server Error"),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(JSON.parse(successBody)),
      });
    vi.stubGlobal("fetch", flakyFetch);

    const { analyzeTopic } = await import("../ai");

    const promise = analyzeTopic("some content");

    // Advance past the first retry delay (1s)
    await vi.advanceTimersByTimeAsync(1000);

    const actual = await promise;
    expect(actual).toEqual(result);
    expect(flakyFetch).toHaveBeenCalledTimes(2);
  });

  it("throws AIResponseError when API returns empty content", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");

    const emptyBody = JSON.stringify({
      id: "test-id",
      choices: [{ index: 0, message: { role: "assistant", content: "" }, finish_reason: "stop" }],
    });
    vi.stubGlobal("fetch", mockFetchResolved(emptyBody));

    const { analyzeTopic, AIResponseError } = await import("../ai");
    await expect(analyzeTopic("some content")).rejects.toThrow(AIResponseError);
    await expect(analyzeTopic("some content")).rejects.toThrow("empty or missing message content");
  });
});

// ===========================================================================

describe("generateContent", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("throws AIError on empty topic", async () => {
    const { generateContent, AIError } = await import("../ai");
    await expect(generateContent("", "wechat")).rejects.toThrow(AIError);
    await expect(generateContent("   ", "twitter")).rejects.toThrow("Topic must not be empty");
  });

  it("throws AIError when SILICONFLOW_API_KEY is not set", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "");
    vi.stubGlobal("fetch", vi.fn());

    const { generateContent, AIError } = await import("../ai");
    await expect(generateContent("topic", "wechat")).rejects.toThrow(AIError);
    await expect(generateContent("topic", "wechat")).rejects.toThrow(
      "SILICONFLOW_API_KEY environment variable is not set",
    );
  });

  it("returns generated content on success (wechat)", async () => {
    const markdown = "# Great Article\n\nThis is the content.";
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchWithContent(markdown));

    const { generateContent } = await import("../ai");
    const result = await generateContent("AI trends", "wechat");

    expect(result).toBe(markdown);
    expect(fetch).toHaveBeenCalledTimes(1);

    // Verify the fetch was called with wechat-specific system prompt
    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    const systemMsg = body.messages[0].content;
    expect(systemMsg).toContain("WeChat Official Account");
    expect(systemMsg).toContain("Target length: approximately 800 words");
    expect(systemMsg).toContain("Tone: professional");
  });

  it("returns generated content on success (xiaohongshu)", async () => {
    const markdown = "## Xiaohongshu Post\n\nShort and sweet!";
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchWithContent(markdown));

    const { generateContent } = await import("../ai");
    const result = await generateContent("skincare tips", "xiaohongshu");

    expect(result).toBe(markdown);

    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    const systemMsg = body.messages[0].content;
    expect(systemMsg).toContain("Xiaohongshu");
  });

  it("returns generated content on success (twitter)", async () => {
    const markdown = "1/ Thread start\n2/ Thread middle\n3/ Thread end";
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchWithContent(markdown));

    const { generateContent } = await import("../ai");
    const result = await generateContent("hot takes", "twitter");

    expect(result).toBe(markdown);

    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    const systemMsg = body.messages[0].content;
    expect(systemMsg).toContain("Twitter/X thread");
  });

  it("applies custom wordCount option", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchWithContent("content"));

    const { generateContent } = await import("../ai");
    await generateContent("topic", "wechat", { wordCount: 2000 });

    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    const systemMsg = body.messages[0].content;
    expect(systemMsg).toContain("approximately 2000 words");
  });

  it("applies custom tone option", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchWithContent("content"));

    const { generateContent } = await import("../ai");
    await generateContent("topic", "twitter", { tone: "casual" });

    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    const systemMsg = body.messages[0].content;
    expect(systemMsg).toContain("Tone: casual");
  });

  it("appends extraInstructions when provided", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchWithContent("content"));

    const { generateContent } = await import("../ai");
    await generateContent("topic", "wechat", { extraInstructions: "Include a data table." });

    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    const systemMsg = body.messages[0].content;
    expect(systemMsg).toContain("Include a data table.");
  });

  it("omits extraInstructions when not provided", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchWithContent("content"));

    const { generateContent } = await import("../ai");
    await generateContent("topic", "wechat");

    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    const systemMsg = body.messages[0].content;
    // Should not contain an empty line where extra instructions would go
    expect(systemMsg).not.toContain("Include a data table.");
  });

  it("uses the correct API endpoint and auth header", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "my-secret-key");
    vi.stubGlobal("fetch", mockFetchWithContent("content"));

    const { generateContent } = await import("../ai");
    await generateContent("topic", "wechat");

    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const url = fetchCall[0];
    const options = fetchCall[1];
    expect(url).toBe("https://api.siliconflow.cn/v1/chat/completions");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer my-secret-key");
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  it("throws AIAPIError on non-2xx response without retrying (4xx)", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchResolved("Forbidden", 403));

    const { generateContent, AIAPIError } = await import("../ai");
    await expect(generateContent("topic", "wechat")).rejects.toThrow(AIAPIError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries on 5xx and then throws AIAPIError", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubGlobal("fetch", mockFetchResolved("Server Error", 502));

    const { generateContent, AIAPIError } = await import("../ai");

    const promise = generateContent("topic", "wechat");

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    await expect(promise).rejects.toThrow(AIAPIError);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("throws AIRequestError on timeout", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");

    const abortError = new DOMException("The operation was aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    const { generateContent, AIRequestError } = await import("../ai");

    const promise = generateContent("topic", "twitter");

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    await expect(promise).rejects.toThrow(AIRequestError);
    await expect(promise).rejects.toThrow("Request failed after 3 attempts");
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("throws AIResponseError when API returns empty content", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");

    const emptyBody = JSON.stringify({
      id: "test-id",
      choices: [{ index: 0, message: { role: "assistant", content: "" }, finish_reason: "stop" }],
    });
    vi.stubGlobal("fetch", mockFetchResolved(emptyBody));

    const { generateContent, AIResponseError } = await import("../ai");
    await expect(generateContent("topic", "wechat")).rejects.toThrow(AIResponseError);
  });

  it("recovers from transient failure on retry", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");

    const successBody = JSON.stringify({
      id: "test-id",
      choices: [{ index: 0, message: { role: "assistant", content: "Recovered!" }, finish_reason: "stop" }],
    });

    const flakyFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Server Error"),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(JSON.parse(successBody)),
      });
    vi.stubGlobal("fetch", flakyFetch);

    const { generateContent } = await import("../ai");

    const promise = generateContent("topic", "wechat");
    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;
    expect(result).toBe("Recovered!");
    expect(flakyFetch).toHaveBeenCalledTimes(2);
  });
});

// ===========================================================================

describe("SILICONFLOW_MODEL env override", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("uses custom model from env when set", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubEnv("SILICONFLOW_MODEL", "custom/model-v1");
    vi.stubGlobal("fetch", mockFetchWithContent("content"));

    const { generateContent } = await import("../ai");
    await generateContent("topic", "wechat");

    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.model).toBe("custom/model-v1");
  });

  it("uses default model when env is not set", async () => {
    vi.stubEnv("SILICONFLOW_API_KEY", "test-key");
    vi.stubEnv("SILICONFLOW_MODEL", "");
    vi.stubGlobal("fetch", mockFetchWithContent("content"));

    const { generateContent } = await import("../ai");
    await generateContent("topic", "wechat");

    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.model).toBe("deepseek-ai/DeepSeek-V3");
  });
});
