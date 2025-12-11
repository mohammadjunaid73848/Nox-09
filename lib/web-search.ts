interface SearchResult {
  title: string
  link: string
  snippet: string
  displayLink: string
}

interface SearchResponse {
  items?: SearchResult[]
}

export interface SearchDebugInfo {
  type: "search-debug"
  message: string
  data: any
  timestamp: string
}

import { isTimeQuery } from "@/lib/time"

function isLikelyUrl(query: string): boolean {
  const q = query.trim().toLowerCase()
  // Looks like a domain or includes a scheme
  return /^https?:\/\//.test(q) || /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(q)
}

function normalizeUrl(query: string): string {
  const q = query.trim()
  if (/^https?:\/\//i.test(q)) return q
  return `https://${q}`
}

function getHostname(urlStr: string): string {
  try {
    return new URL(urlStr).hostname
  } catch {
    return urlStr
  }
}

export async function searchWeb(query: string): Promise<{ results: SearchResult[]; debugInfo: SearchDebugInfo[] }> {
  const debugLogs: SearchDebugInfo[] = []

  function addDebug(message: string, data: any = {}) {
    const debugInfo: SearchDebugInfo = {
      type: "search-debug",
      message,
      data,
      timestamp: new Date().toISOString(),
    }
    debugLogs.push(debugInfo)
    console.log("[v0]", message, data)
  }

  const apiKey = process.env.GOOGLE_CSE_API_KEY || "AIzaSyBPyKI4tUhRmgVxW4WUaVzfw8wWiJI55OQ"
  const searchEngineId = process.env.GOOGLE_CSE_CX || "76c97dff469e44c53"

  addDebug("Web search initiated", {
    query,
    apiKeyConfigured: !!process.env.GOOGLE_CSE_API_KEY,
    cxConfigured: !!process.env.GOOGLE_CSE_CX,
  })

  if (isLikelyUrl(query)) {
    const url = normalizeUrl(query)
    addDebug("Query detected as URL, fetching directly", { url })

    try {
      const res = await fetch(url, { redirect: "follow" })
      addDebug("Direct URL fetch response", { status: res.status, ok: res.ok })

      if (!res.ok) {
        addDebug("Direct URL fetch failed", { status: res.status, statusText: res.statusText })
        return {
          results: [
            {
              title: getHostname(url),
              link: url,
              snippet: "Direct URL provided.",
              displayLink: getHostname(url),
            },
          ],
          debugInfo: debugLogs,
        }
      }

      const html = await res.text()
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)
      const title = titleMatch?.[1]?.trim() || getHostname(url)
      const snippet = metaDescMatch?.[1]?.trim() || "Direct page fetched. No meta description found."

      addDebug("Direct URL fetch successful", { title, snippetLength: snippet.length })

      return {
        results: [
          {
            title,
            link: url,
            snippet,
            displayLink: getHostname(url),
          },
        ],
        debugInfo: debugLogs,
      }
    } catch (error) {
      addDebug("Direct URL fetch error", { error: error instanceof Error ? error.message : String(error) })
      return {
        results: [
          {
            title: getHostname(url),
            link: url,
            snippet: "Direct URL provided.",
            displayLink: getHostname(url),
          },
        ],
        debugInfo: debugLogs,
      }
    }
  }

  try {
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(
      query,
    )}&num=5`

    addDebug("Making Google Custom Search API request", {
      apiKeyLength: apiKey.length,
      searchEngineId,
      queryEncoded: encodeURIComponent(query),
    })

    const response = await fetch(searchUrl)

    addDebug("Google CSE API response received", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: {
        contentType: response.headers.get("content-type"),
        contentLength: response.headers.get("content-length"),
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      addDebug("Google CSE API returned error", {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText.substring(0, 500),
      })

      try {
        const errorJson = JSON.parse(errorText)
        addDebug("Google CSE API error details (parsed)", {
          code: errorJson.error?.code,
          message: errorJson.error?.message,
          status: errorJson.error?.status,
          errors: errorJson.error?.errors,
        })
      } catch {
        addDebug("Could not parse error response as JSON", { rawError: errorText.substring(0, 200) })
      }

      throw new Error(`Search API error: ${response.status} - ${errorText}`)
    }

    const data: SearchResponse = await response.json()

    addDebug("Google CSE API response parsed", {
      hasItems: !!data.items,
      itemCount: data.items?.length || 0,
      rawResponseKeys: Object.keys(data),
    })

    if (!data.items || data.items.length === 0) {
      addDebug("⚠️ ZERO RESULTS RETURNED", {
        possibleCauses: [
          "Invalid API key or Search Engine ID",
          "Search engine not configured properly in Google CSE console",
          "Query doesn't match any indexed pages in your search engine",
          "API quota exceeded (100 queries/day on free tier)",
          "Search engine has no sites added to search",
        ],
        nextSteps: [
          "Check API key is valid at https://console.cloud.google.com/apis/credentials",
          "Verify Search Engine ID at https://programmablesearchengine.google.com/",
          "Ensure your search engine has 'Search the entire web' enabled OR has specific sites added",
          "Check API quota at https://console.cloud.google.com/apis/api/customsearch.googleapis.com/quotas",
        ],
        apiKeyUsed: apiKey.substring(0, 10) + "..." + apiKey.substring(apiKey.length - 4),
        searchEngineIdUsed: searchEngineId,
      })
    }

    if (data.items && data.items.length > 0) {
      addDebug("Search results found", {
        count: data.items.length,
        firstResult: {
          title: data.items[0].title,
          link: data.items[0].link,
          snippetPreview: data.items[0].snippet.substring(0, 100) + "...",
        },
      })
    }

    return {
      results: data.items || [],
      debugInfo: debugLogs,
    }
  } catch (error) {
    addDebug("Web search exception caught", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return {
      results: [],
      debugInfo: debugLogs,
    }
  }
}

export function shouldSearchWeb(userMessage: string): boolean {
  if (!userMessage || typeof userMessage !== "string") return false

  const message = userMessage.toLowerCase().trim()

  if (isTimeQuery(userMessage)) return false

  // Don't search for basic greetings and simple responses
  const basicPatterns = [
    /^(hi|hello|hey|good morning|good afternoon|good evening)$/,
    /^(thanks|thank you|ok|okay|yes|no)$/,
    /^(what is your name|who are you|what are you)$/,
    /^(how are you|how do you do)$/,
  ]

  if (basicPatterns.some((pattern) => pattern.test(message))) {
    return false
  }

  // Search for current/recent information
  const currentInfoPatterns = [
    /\b(latest|recent|current|today|now|this (year|month|week))\b/,
    /\b(news|breaking|happening now|update)\b/,
    /\b(2024|2025)\b/,
    /\b(stock price|weather|temperature)\b/,
    /\b(live|real-time|up-to-date)\b/,
    /\b(timezone|utc|gmt)\b/,
  ]

  // Search for specific websites or companies
  const websitePatterns = [
    /\b(website|site|\.com|\.org|\.net)\b/,
    /\b(company|business|startup)\b.*\b(about|information|details)\b/,
  ]

  // Search for comparisons and reviews
  const comparisonPatterns = [
    /\b(compare|vs|versus|difference between)\b/,
    /\b(best|top|review|rating|recommend)\b/,
    /\b(price|cost|expensive|cheap)\b.*\b(compare|vs)\b/,
  ]

  // Search for specific factual queries that might need current data
  const factualPatterns = [
    /\b(population|gdp|statistics|data|facts) of\b/,
    /\b(when (did|was|will)|what happened)\b/,
    /\b(who is|who was) [A-Z]/,
  ]

  return (
    currentInfoPatterns.some((pattern) => pattern.test(message)) ||
    websitePatterns.some((pattern) => pattern.test(message)) ||
    comparisonPatterns.some((pattern) => pattern.test(message)) ||
    factualPatterns.some((pattern) => pattern.test(message))
  )
}

export function extractSearchQuery(userMessage: string): string {
  // Remove common conversational elements and extract the core query
  let query = userMessage
    .replace(
      /^(can you|could you|please|tell me|what is|what are|how to|how do|when is|where is|who is|why is|search|open)/i,
      "",
    )
    .replace(/\?$/, "")
    .trim()

  // If the query is too short, use the original message
  if (query.length < 3) {
    query = userMessage
  }

  return query
}
