// This uses Together AI to intelligently search and parse web results

export interface WebSearchResult {
  title: string
  url: string
  snippet: string
  domain: string
  relevance: number
  image?: string
  video?: string
}

export interface WebSearchResponse {
  results: WebSearchResult[]
  query: string
  timestamp: string
  debugInfo: Array<{
    type: string
    message: string
    data?: any
  }>
}

/**
 * Performs intelligent web search using Google Custom Search API
 * Returns structured JSON data instead of HTML
 */
export async function searchWebJSON(query: string): Promise<WebSearchResponse> {
  const debugInfo: Array<{ type: string; message: string; data?: any }> = []
  const timestamp = new Date().toISOString()

  function addDebug(type: string, message: string, data?: any) {
    debugInfo.push({ type, message, data })
    console.log(`[v0] [${type}]`, message, data || "")
  }

  addDebug("search", "Starting web search", { query, timestamp })

  const apiKey = process.env.GOOGLE_CSE_API_KEY
  const searchEngineId = process.env.GOOGLE_CSE_CX

  if (!apiKey || !searchEngineId) {
    addDebug("error", "Missing Google CSE credentials", {
      hasApiKey: !!apiKey,
      hasSearchEngineId: !!searchEngineId,
      message:
        "Please add GOOGLE_CSE_API_KEY and GOOGLE_CSE_CX environment variables to enable web search. Visit https://developers.google.com/custom-search/v1/overview to get your API key.",
    })
    return {
      results: [],
      query,
      timestamp,
      debugInfo,
    }
  }

  try {
    let enhancedQuery = query
    const needsDateContext = /\b(latest|recent|current|today|now|news|update|2025)\b/i.test(query)
    if (needsDateContext && !/\b(2024|2025)\b/.test(query)) {
      enhancedQuery = `${query} 2025`
      addDebug("search", "Enhanced query with year", { original: query, enhanced: enhancedQuery })
    }

    let response: Response | null = null
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(enhancedQuery)}&num=10`

        addDebug("search", `Calling Google Custom Search API (attempt ${attempt}/3)`, { query: enhancedQuery })

        response = await fetch(searchUrl, {
          signal: AbortSignal.timeout(10000),
        })

        if (response.ok) {
          break
        }

        if (response.status === 429) {
          addDebug("search", `Rate limited on attempt ${attempt}, waiting before retry...`, {})
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
        } else {
          break
        }
      } catch (error) {
        lastError = error as Error
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt))
        }
      }
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : lastError?.message || "Unknown error"
      addDebug("error", "Google CSE API error after retries", {
        status: response?.status,
        statusText: response?.statusText,
        error: errorText.substring(0, 200),
        hint:
          response?.status === 429
            ? "API quota exceeded. Please check your Google CSE quota limits."
            : response?.status === 403
              ? "API key invalid or unauthorized. Please verify your GOOGLE_CSE_API_KEY."
              : "API request failed. Please check your configuration.",
      })

      return {
        results: [],
        query,
        timestamp,
        debugInfo,
      }
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      addDebug("search", "No results found", { query: enhancedQuery })
      return {
        results: [],
        query,
        timestamp,
        debugInfo,
      }
    }

    const results: WebSearchResult[] = data.items.map((item: any, index: number) => {
      let relevance = 1 - index * 0.05

      if (item.snippet && /\b(2025|2024|today|recent|latest)\b/i.test(item.snippet)) {
        relevance += 0.1
      }

      const authoritativeDomains = [
        "wikipedia.org",
        "gov",
        "edu",
        "reuters.com",
        "bbc.com",
        "nytimes.com",
        "theguardian.com",
      ]
      if (authoritativeDomains.some((domain) => item.displayLink?.includes(domain))) {
        relevance += 0.15
      }

      const image = item.pagemap?.cse_image?.[0]?.src || item.pagemap?.metatags?.[0]?.["og:image"]
      const video = item.pagemap?.videoobject?.[0]?.embedurl || item.pagemap?.metatags?.[0]?.["og:video"]

      return {
        title: item.title || "Untitled",
        url: item.link || "",
        snippet: item.snippet || "",
        domain: item.displayLink || new URL(item.link).hostname,
        relevance: Math.min(relevance, 1),
        image: image || undefined,
        video: video || undefined,
      }
    })

    results.sort((a, b) => b.relevance - a.relevance)

    addDebug("search", "Search completed successfully", {
      resultCount: results.length,
      topResult: results[0]?.title,
      avgRelevance: (results.reduce((sum, r) => sum + r.relevance, 0) / results.length).toFixed(2),
    })

    return {
      results,
      query: enhancedQuery,
      timestamp,
      debugInfo,
    }
  } catch (error) {
    addDebug("error", "Web search exception", {
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error && error.name === "TimeoutError" ? "timeout" : "unknown",
      hint:
        error instanceof Error && error.name === "TimeoutError"
          ? "Search request timed out. Please try again."
          : "An unexpected error occurred during web search.",
    })

    return {
      results: [],
      query,
      timestamp,
      debugInfo,
    }
  }
}

/**
 * Determines if a user query requires web search
 */
export function shouldPerformWebSearch(userMessage: string): boolean {
  if (!userMessage || typeof userMessage !== "string") return false

  const message = userMessage.toLowerCase().trim()

  // Don't search for basic greetings
  const basicPatterns = [
    /^(hi|hello|hey|good morning|good afternoon|good evening)$/,
    /^(thanks|thank you|ok|okay|yes|no)$/,
    /^(what is your name|who are you|what are you)$/,
    /^(how are you)$/,
  ]

  if (basicPatterns.some((pattern) => pattern.test(message))) {
    return false
  }

  const searchTriggers = [
    /\b(latest|recent|current|today|now|this (year|month|week))\b/,
    /\b(news|breaking|happening|update)\b/,
    /\b(2024|2025)\b/,
    /\b(stock price|weather|temperature|forecast)\b/,
    /\b(live|real-time|up-to-date)\b/,
    /\b(search|find|look up|google)\b/,
    /\b(compare|vs|versus|difference between)\b/,
    /\b(best|top|review|rating)\b/,
    /\b(price|cost|buy)\b/,
    /\b(who is|what is|where is|when is|how to)\b.*\b(2024|2025|now|today|current)\b/,
    /\b(trending|popular|viral)\b/,
    /\b(release date|launch|announcement)\b/,
    /\b(statistics|data|facts|information)\b/,
  ]

  return searchTriggers.some((pattern) => pattern.test(message))
}

/**
 * Extracts clean search query from user message
 */
export function extractCleanQuery(userMessage: string): string {
  let query = userMessage
    .replace(/^(can you|could you|please|tell me|search for|find|look up|google)/i, "")
    .replace(/\?$/, "")
    .trim()

  if (query.length < 3) {
    query = userMessage
  }

  return query
}
