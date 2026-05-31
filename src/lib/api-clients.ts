/**
 * Third-party API clients for content collection.
 *
 * Currently supports:
 * - dajiala.com: WeChat Official Account article collection
 *
 * Follows the same error-class hierarchy and retry pattern used in {@link ./ai.ts}.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single article collected from an external source. */
export interface CollectedArticle {
  /** Article title. */
  title: string;
  /** Canonical URL of the article. */
  url: string;
  /** Author or account name that published the article. */
  author: string;
  /** Publication date in ISO-8601 format (YYYY-MM-DD or full datetime). */
  publishDate: string;
  /** Short summary or excerpt. */
  summary: string;
  /** Full article body (may be HTML or plain text depending on the source). */
  content: string;
  /** Origin platform. */
  source: "wechat" | "xiaohongshu";
}

/** Options for searching / filtering articles. */
export interface CollectOptions {
  /** Keyword to search for. */
  keyword?: string;
  /** WeChat Official Account name to scope the search. */
  accountName?: string;
  /** Start of the date range (inclusive, YYYY-MM-DD). */
  startDate?: string;
  /** End of the date range (inclusive, YYYY-MM-DD). */
  endDate?: string;
  /** Page number (1-indexed). Defaults to 1. */
  page?: number;
  /** Number of results per page. Defaults to 10. */
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

/** Base error for all content-collection failures. */
export class CollectionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "CollectionError";
  }
}

/** Thrown when the collection API returns a non-2xx response. */
export class CollectionAPIError extends CollectionError {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody: string,
    cause?: unknown,
  ) {
    super(message, cause);
    this.name = "CollectionAPIError";
  }
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = "https://www.dajiala.com";
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
/** Minimum interval between requests in milliseconds (max 2 req/s). */
const MIN_REQUEST_INTERVAL_MS = 500;

// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------

let lastRequestTime = 0;

/**
 * Enforce a minimum interval between outgoing requests.
 * Blocks the caller until enough time has elapsed since the previous request.
 */
async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
  }
  lastRequestTime = Date.now();
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
 * Read the dajiala.com API key from the environment.
 * @throws {CollectionError} If the key is not configured.
 */
function getApiKey(): string {
  const key = process.env.DAJIALA_API_KEY;
  if (!key) {
    throw new CollectionError("DAJIALA_API_KEY environment variable is not set");
  }
  return key;
}

/** Shape of a raw article object returned by the dajiala.com API. */
interface DajialaArticle {
  title?: string;
  url?: string;
  author?: string;
  publish_date?: string;
  summary?: string;
  content?: string;
}

/** Shape of a dajiala.com API response. */
interface DajialaResponse {
  code: number;
  msg?: string;
  data?: {
    articles?: DajialaArticle[];
    total?: number;
  };
}

/**
 * Perform a rate-limited, retried request to the dajiala.com API.
 *
 * @param endpoint - The API path (without the base URL).
 * @param params   - Query parameters to append.
 * @returns The parsed JSON response body.
 * @throws {CollectionError}       If the API key is missing.
 * @throws {CollectionAPIError}    If the API returns a non-2xx response.
 * @throws {CollectionError}       If the request times out after retries.
 */
async function dajialaRequest(
  endpoint: string,
  params: Record<string, string>,
): Promise<DajialaResponse> {
  const apiKey = getApiKey();

  const url = new URL(endpoint, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Exponential back-off on retries
    if (attempt > 0) {
      await sleep(1000 * Math.pow(2, attempt - 1));
    }

    // Respect rate limit
    await throttle();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new CollectionAPIError(
          `dajiala.com API returned ${response.status}: ${text}`,
          response.status,
          text,
        );
      }

      const data = (await response.json()) as DajialaResponse;

      if (data.code !== 0 && data.code !== 200) {
        throw new CollectionAPIError(
          `dajiala.com API error: ${data.msg ?? "unknown error"}`,
          502,
          JSON.stringify(data),
        );
      }

      return data;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;

      // Don't retry on client errors (4xx) -- they won't succeed on retry.
      if (
        err instanceof CollectionAPIError &&
        err.statusCode >= 400 &&
        err.statusCode < 500
      ) {
        throw err;
      }

      // AbortError means timeout
      if (err instanceof DOMException && err.name === "AbortError") {
        lastError = new CollectionError("Request timed out", err);
        continue; // retry
      }

      // CollectionAPIError with 5xx -- retry
      if (err instanceof CollectionAPIError) {
        continue;
      }
    }
  }

  throw new CollectionError(
    `Request failed after ${MAX_RETRIES + 1} attempts`,
    lastError,
  );
}

/**
 * Map a raw dajiala article to the normalised CollectedArticle shape.
 */
function mapArticle(raw: DajialaArticle): CollectedArticle {
  return {
    title: raw.title ?? "",
    url: raw.url ?? "",
    author: raw.author ?? "",
    publishDate: raw.publish_date ?? "",
    summary: raw.summary ?? "",
    content: raw.content ?? "",
    source: "wechat",
  };
}

// ---------------------------------------------------------------------------
// Public API -- dajiala.com WeChat collection client
// ---------------------------------------------------------------------------

/**
 * Search for WeChat articles via the dajiala.com collection API.
 *
 * @param options - Search and pagination options.
 * @returns An array of collected articles matching the query.
 * @throws {CollectionError}    If the API key is missing or the request fails.
 * @throws {CollectionAPIError} If the API returns an error response.
 */
export async function searchArticles(
  options: CollectOptions,
): Promise<CollectedArticle[]> {
  if (!options.keyword && !options.accountName) {
    throw new CollectionError(
      "At least one of keyword or accountName must be provided",
    );
  }

  const params: Record<string, string> = {};
  if (options.keyword) params.keyword = options.keyword;
  if (options.accountName) params.account_name = options.accountName;
  if (options.startDate) params.start_date = options.startDate;
  if (options.endDate) params.end_date = options.endDate;
  if (options.page !== undefined) params.page = String(options.page);
  if (options.pageSize !== undefined) params.page_size = String(options.pageSize);

  const response = await dajialaRequest("/fc/pc/search", params);
  const articles = response.data?.articles ?? [];
  return articles.map(mapArticle);
}

/**
 * Fetch the full content of a single WeChat article by its URL.
 *
 * @param url - The WeChat article URL to retrieve.
 * @returns The collected article with full content.
 * @throws {CollectionError}    If the API key is missing or the request fails.
 * @throws {CollectionAPIError} If the API returns an error response.
 */
export async function getArticleContent(url: string): Promise<CollectedArticle> {
  if (!url.trim()) {
    throw new CollectionError("Article URL must not be empty");
  }

  const response = await dajialaRequest("/fc/pc/article", { url });

  const raw = response.data as unknown as DajialaArticle | undefined;
  if (!raw) {
    throw new CollectionError("dajiala.com returned no article data");
  }

  return mapArticle(raw);
}
