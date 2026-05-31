/**
 * SiliconFlow API wrapper for AI-powered topic analysis and content generation.
 *
 * Uses the SiliconFlow chat completions endpoint with configurable model and
 * automatic retry logic.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result of an AI-powered topic analysis. */
export interface TopicAnalysisResult {
  /** High-level summary of the topic and its content landscape. */
  summary: string;
  /** Actionable insights drawn from the collected content. */
  keyInsights: string[];
  /** Suggested angles for creating new content on this topic. */
  contentAngles: string[];
  /** How trending this topic is right now (0-100). */
  trendingScore: number;
  /** Platforms recommended for publishing, with rationale. */
  recommendedPlatforms: PlatformRecommendation[];
}

export interface PlatformRecommendation {
  name: string;
  reason: string;
}

export type Platform = "wechat" | "xiaohongshu" | "twitter";

export interface GenerateOptions {
  /** Target word count (approximate). Defaults to 800. */
  wordCount?: number;
  /** Desired tone, e.g. "professional", "casual". Defaults to "professional". */
  tone?: string;
  /** Additional instructions appended to the system prompt. */
  extraInstructions?: string;
}

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

/** Base error for all AI-related failures. */
export class AIError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AIError";
  }
}

/** Thrown when the SiliconFlow API returns a non-2xx response. */
export class AIAPIError extends AIError {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody: string,
    cause?: unknown,
  ) {
    super(message, cause);
    this.name = "AIAPIError";
  }
}

/** Thrown when the AI response cannot be parsed into the expected shape. */
export class AIResponseError extends AIError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "AIResponseError";
  }
}

/** Thrown when a request times out or the retry budget is exhausted. */
export class AIRequestError extends AIError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "AIRequestError";
  }
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = "https://api.siliconflow.cn/v1/chat/completions";
const DEFAULT_MODEL = "deepseek-ai/DeepSeek-V3";
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionChoice {
  index: number;
  message: { role: string; content: string };
  finish_reason: string;
}

interface ChatCompletionResponse {
  id: string;
  choices: ChatCompletionChoice[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

function getApiKey(): string {
  const key = process.env.SILICONFLOW_API_KEY;
  if (!key) {
    throw new AIError("SILICONFLOW_API_KEY environment variable is not set");
  }
  return key;
}

function getModel(): string {
  return process.env.SILICONFLOW_MODEL || DEFAULT_MODEL;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Sleep for the given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send a chat completion request to SiliconFlow with retry and timeout.
 */
async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const apiKey = getApiKey();
  const model = getModel();
  const body = JSON.stringify({ model, messages });

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Exponential back-off: 1s, 2s
      await sleep(1000 * Math.pow(2, attempt - 1));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new AIAPIError(
          `SiliconFlow API returned ${response.status}: ${text}`,
          response.status,
          text,
        );
      }

      const data = (await response.json()) as ChatCompletionResponse;
      const content = data.choices?.[0]?.message?.content;

      if (typeof content !== "string" || content.length === 0) {
        throw new AIResponseError("API returned an empty or missing message content");
      }

      return content;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;

      // Don't retry on client errors (4xx) -- they won't succeed on retry.
      if (err instanceof AIAPIError && err.statusCode >= 400 && err.statusCode < 500) {
        throw err;
      }

      // AbortError means timeout
      if (err instanceof DOMException && err.name === "AbortError") {
        lastError = new AIRequestError("Request timed out", err);
        continue; // retry
      }
    }
  }

  throw new AIRequestError(
    `Request failed after ${MAX_RETRIES + 1} attempts`,
    lastError,
  );
}

/**
 * Extract a JSON object from a string that may be wrapped in markdown fences.
 */
function extractJSON(text: string): string {
  // Try to find a JSON block inside ```json ... ```
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Otherwise, find the first { ... } block
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];
  return text.trim();
}

/**
 * Validate that a parsed object matches the TopicAnalysisResult shape.
 */
function isTopicAnalysisResult(value: unknown): value is TopicAnalysisResult {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.summary !== "string") return false;
  if (!Array.isArray(obj.keyInsights) || !obj.keyInsights.every((v: unknown) => typeof v === "string"))
    return false;
  if (!Array.isArray(obj.contentAngles) || !obj.contentAngles.every((v: unknown) => typeof v === "string"))
    return false;
  if (typeof obj.trendingScore !== "number" || obj.trendingScore < 0 || obj.trendingScore > 100)
    return false;
  if (
    !Array.isArray(obj.recommendedPlatforms) ||
    !obj.recommendedPlatforms.every(
      (p: unknown) =>
        typeof p === "object" &&
        p !== null &&
        typeof (p as Record<string, unknown>).name === "string" &&
        typeof (p as Record<string, unknown>).reason === "string",
    )
  )
    return false;
  return true;
}

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

const TOPIC_ANALYSIS_SYSTEM_PROMPT = `You are an expert content strategist and social-media analyst for the Chinese market. You specialise in WeChat, Xiaohongshu (Little Red Book), and Twitter/X.

When given collected content about a topic, produce a JSON object with EXACTLY this shape (no extra keys, no markdown fences):
{
  "summary": "<2-4 sentence overview of the topic and content landscape>",
  "keyInsights": ["<insight 1>", "<insight 2>", ...],
  "contentAngles": ["<angle 1>", "<angle 2>", ...],
  "trendingScore": <integer 0-100>,
  "recommendedPlatforms": [
    { "name": "<platform>", "reason": "<why it fits>" }
  ]
}

Guidelines:
- summary: concise, data-driven when possible.
- keyInsights: 3-6 actionable takeaways.
- contentAngles: 3-5 specific content ideas that could be produced.
- trendingScore: 0 = dead topic, 100 = viral. Base this on recency, volume, and momentum signals in the content.
- recommendedPlatforms: pick 2-3 platforms. For each, explain why the topic suits that platform's audience and format.

Return ONLY the JSON object. No commentary before or after.`;

function buildContentGenerationPrompt(
  topic: string,
  platform: Platform,
  options: GenerateOptions,
): ChatMessage[] {
  const platformInstructions: Record<Platform, string> = {
    wechat:
      "Write a WeChat Official Account article. Use markdown. Include a compelling title, an engaging opening hook, structured sections with subheadings, and a call-to-action at the end. Length should be suitable for a WeChat long-form article (1500-2500 Chinese characters).",
    xiaohongshu:
      "Write a Xiaohongshu (Little Red Book) post. Use markdown. Start with an eye-catching title using emojis. Write in a friendly, personal tone. Use short paragraphs, bullet points, and emojis to break up text. Include relevant hashtags at the end. Keep it concise (500-1000 Chinese characters).",
    twitter:
      "Write a Twitter/X thread (3-6 tweets). Number each tweet (1/, 2/, etc.). Each tweet must be under 280 characters. Start with a hook, develop the idea across the thread, and end with a call-to-action or question. Include 2-3 relevant hashtags in the final tweet.",
  };

  const wordCount = options.wordCount ?? 800;
  const tone = options.tone ?? "professional";

  const systemContent = [
    "You are a skilled content writer for Chinese social media platforms.",
    `Platform: ${platform}`,
    platformInstructions[platform],
    `Tone: ${tone}`,
    `Target length: approximately ${wordCount} words.`,
    options.extraInstructions ?? "",
    "Write the content in Chinese (Simplified) unless the topic explicitly requires another language.",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: systemContent },
    { role: "user", content: `Generate content about: ${topic}` },
  ];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyse collected content about a topic using the SiliconFlow AI.
 *
 * @param content - The raw collected text (articles, posts, snippets) to analyse.
 * @returns A structured analysis including summary, insights, angles, trending score,
 *          and recommended platforms.
 * @throws {AIError} If the API key is missing.
 * @throws {AIAPIError} If the API returns a non-2xx response.
 * @throws {AIResponseError} If the response cannot be parsed.
 * @throws {AIRequestError} If the request times out after retries.
 */
export async function analyzeTopic(content: string): Promise<TopicAnalysisResult> {
  if (!content.trim()) {
    throw new AIError("Content must not be empty");
  }

  const messages: ChatMessage[] = [
    { role: "system", content: TOPIC_ANALYSIS_SYSTEM_PROMPT },
    { role: "user", content },
  ];

  const raw = await chatCompletion(messages);
  const jsonText = extractJSON(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    throw new AIResponseError(
      `Failed to parse AI response as JSON: ${jsonText.slice(0, 200)}`,
      err,
    );
  }

  if (!isTopicAnalysisResult(parsed)) {
    throw new AIResponseError(
      "AI response does not match the expected TopicAnalysisResult shape",
    );
  }

  return parsed;
}

/**
 * Generate platform-tailored content for a given topic using the SiliconFlow AI.
 *
 * @param topic - The topic or brief to generate content for.
 * @param platform - Target platform ("wechat" | "xiaohongshu" | "twitter").
 * @param options - Optional generation parameters (word count, tone, etc.).
 * @returns The generated content as a markdown string.
 * @throws {AIError} If the API key is missing or topic is empty.
 * @throws {AIAPIError} If the API returns a non-2xx response.
 * @throws {AIResponseError} If the response is empty.
 * @throws {AIRequestError} If the request times out after retries.
 */
export async function generateContent(
  topic: string,
  platform: Platform,
  options: GenerateOptions = {},
): Promise<string> {
  if (!topic.trim()) {
    throw new AIError("Topic must not be empty");
  }

  const messages = buildContentGenerationPrompt(topic, platform, options);
  return chatCompletion(messages);
}
