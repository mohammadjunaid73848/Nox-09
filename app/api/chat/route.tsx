import type { NextRequest } from "next/server"
import { createCerebrasStream, parseCerebrasStream } from "@/lib/cerebras"
import { parseTogetherStream, createTogetherStream, createTogetherVisionStream } from "@/lib/together-ai"
import { createNvidiaDeepSeekStream, parseNvidiaStream } from "@/lib/nvidia-deepseek"
import { searchWebJSON, shouldPerformWebSearch, extractCleanQuery } from "@/lib/web-search-json"
import {
  fetchNews,
  fetchWeather,
  fetchCrypto,
  shouldFetchNews,
  shouldFetchWeather,
  shouldFetchCrypto,
  extractNewsQuery,
  extractLocation,
  extractCryptoSymbols,
  fetchCurrencyRate,
  fetchTime,
  shouldFetchCurrency,
  shouldFetchTime,
  extractCurrencyPair,
  extractTimezone,
  fetchIPInfo,
  shouldFetchIPInfo,
  fetchWikipediaSummary,
  shouldFetchWikipedia,
  extractWikipediaTopic,
  fetchReddit,
  shouldFetchReddit,
  extractRedditSubreddit,
} from "@/lib/data-sources"
import { ReadableStream } from "stream/web"
import { TextEncoder } from "util"
import { gatherDeepPasses, buildSynthesisPrompt } from "@/lib/deep-search"
import { createClient as createSupabaseServer } from "@/lib/supabase/server"
import { analyzePromptForTemperature } from "@/lib/analyze-temperature"
import { createNoxyAICompletion } from "@/lib/noxyai"

// Define the RedditPost type before it's used
interface RedditPost {
  title: string
  subreddit: string
  score: number
  author: string
  createdAt: string
  url: string
  upvoteRatio: number
}

const getTodayDate = () => {
  const today = new Date()
  return today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Helper to split streamed content into reasoning/final segments with tag buffering across chunks.
function createReasoningSplitter() {
  // modes: null | "reasoning" | "final"
  let mode: "reasoning" | "final" | null = null
  let buf = ""
  return function split(nextChunk: string): { reasoning: string; final: string } {
    buf += nextChunk
    let reasoningOut = ""
    let finalOut = ""

    // process in small steps to handle partial tags
    while (true) {
      const openReason = buf.indexOf("<reasoning>")
      const closeReason = buf.indexOf("</reasoning>")
      const openFinal = buf.indexOf("<final>")
      const closeFinal = buf.indexOf("</final>")

      // If no tags in buffer and we are inside a mode, flush whole buffer to current mode and break
      if (openReason === -1 && closeReason === -1 && openFinal === -1 && closeFinal === -1) {
        if (mode === "reasoning") {
          reasoningOut += buf
          buf = ""
        } else if (mode === "final") {
          finalOut += buf
          buf = ""
        }
        break
      }

      // Handle entering/exiting modes greedily in correct order of appearance
      // Find earliest tag occurrence
      const tagPositions = [
        { tag: "<reasoning>", pos: openReason, type: "openR" as const },
        { tag: "</reasoning>", pos: closeReason, type: "closeR" as const },
        { tag: "<final>", pos: openFinal, type: "openF" as const },
        { tag: "</final>", pos: closeFinal, type: "closeF" as const },
      ]
        .filter((t) => t.pos !== -1)
        .sort((a, b) => a.pos - b.pos)

      if (tagPositions.length === 0) {
        // No full tag found (partial tag remains); stop now
        break
      }

      const first = tagPositions[0]
      const before = buf.slice(0, first.pos)
      // Emit 'before' to current mode
      if (mode === "reasoning") reasoningOut += before
      else if (mode === "final") finalOut += before

      // Advance past the tag and update mode
      buf = buf.slice(first.pos + first.tag.length)
      if (first.type === "openR") mode = "reasoning"
      else if (first.type === "closeR") mode = null
      else if (first.type === "openF") mode = "final"
      else if (first.type === "closeF") mode = null
    }
    return { reasoning: reasoningOut, final: finalOut }
  }
}

async function* parseGroqStream(stream: any) {
  for await (const chunk of stream) {
    yield chunk
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, model, deepSearch, userLocation, customInstructions, vibeCoding } = await req.json()

    console.log("[v0] Chat API called", {
      messageCount: messages?.length,
      model,
      deepSearch,
      vibeCoding,
      timestamp: new Date().toISOString(),
    })

    const latestMessage = messages[messages.length - 1]
    const userMessage = latestMessage?.content || ""

    const dynamicTemperature = analyzePromptForTemperature(userMessage)

    const isCodeTask = (text: string) => {
      const t = (text || "").toLowerCase()
      return (
        /```/.test(text) ||
        /\b(code|snippet|function|class|bug|debug|fix|refactor|compile|syntax|typescript|javascript|react|next\.js|python|java|c\+\+|html|css|api|algorithm|program|script)\b/.test(
          t,
        ) ||
        /\b(stack trace|error:|exception|undefined is not|cannot read property|write|create|build|develop)\b/.test(t) ||
        /\b(how to|show me how|teach me|explain.*code|implement|make a)\b/.test(t)
      )
    }

    const shouldUseCerebrasForCode = isCodeTask(userMessage)

    const shouldShowCodePlan = vibeCoding && isCodeTask(userMessage)

    const MODEL_REGISTRY: Record<
      string,
      | { provider: "together"; modelId: string }
      | { provider: "cerebras"; modelId: string }
      | { provider: "noxyai"; modelId: string }
      | { provider: "auto" }
      | { provider: "groq"; modelId: string }
      | { provider: "nvidia"; modelId: string }
    > = {
      auto: { provider: "auto" },

      // Cerebras exact IDs (as requested)
      "qwen-3-235b-a22b-instruct-2507": { provider: "cerebras", modelId: "qwen-3-235b-a22b-instruct-2507" },
      "qwen-3-235b-a22b-thinking-2507": { provider: "cerebras", modelId: "qwen-3-235b-a22b-thinking-2507" },
      "qwen-3-32b": { provider: "cerebras", modelId: "qwen-3-32b" },
      "gpt-oss-120b": { provider: "cerebras", modelId: "gpt-oss-120b" },
      "llama-4-scout-17b-16e-instruct": { provider: "cerebras", modelId: "llama-4-scout-17b-16e-instruct" },
      "zai-glm-4.6": { provider: "cerebras", modelId: "zai-glm-4.6" },

      // NVIDIA models
      "nvidia-deepseek-r1": { provider: "nvidia", modelId: "deepseek-ai/deepseek-r1" },
      "nvidia-deepseek-v3.1": { provider: "nvidia", modelId: "deepseek-ai/deepseek-v3.1-terminus" },
      "nvidia-qwen-235b": { provider: "nvidia", modelId: "qwen/qwen3-235b-a22b" },

      "groq-gpt-oss-120b": { provider: "groq", modelId: "openai/gpt-oss-120b" },
      "groq-gpt-oss-20b": { provider: "groq", modelId: "openai/gpt-oss-20b" },
      "groq-qwen-3-32b": { provider: "groq", modelId: "qwen/qwen-3-32b" },
      "groq-llama-3.3-70b": { provider: "groq", modelId: "llama-3.3-70b-versatile" },
      "groq-llama-3.1-70b": { provider: "groq", modelId: "llama-3.1-70b-versatile" },
      "groq-mixtral-8x7b": { provider: "groq", modelId: "mixtral-8x7b-32768" },
      "groq-deepseek-r1": { provider: "groq", modelId: "deepseek-r1-distill-llama-70b" },

      // Together Llama family (keep working Together model)
      "llama-3.3-70b": { provider: "together", modelId: "meta-llama/Llama-3.3-70b-instruct-turbo" },
      "llama-3.1-8b": { provider: "together", modelId: "meta-llama/Llama-3.1-8B-Instruct" },

      // Back-compat with previous ids (optional)
      "together-llama-3.3-70b-instruct-turbo": {
        provider: "together",
        modelId: "meta-llama/Llama-3.3-70b-instruct-turbo",
      },
      "together-llama-3.1-8b-instruct": { provider: "together", modelId: "meta-llama/Llama-3.1-8B-Instruct" },
    }

    const SAFE_CEREBRAS_MODELS = new Set<string>([
      "qwen-3-32b",
      "qwen-3-235b-a22b-instruct-2507",
      "qwen-3-235b-a22b-thinking-2507",
      "gpt-oss-120b",
      "llama-4-scout-17b-16e-instruct",
      "zai-glm-4.6",
    ])

    function sanitizeCerebrasModel(modelId: string): string {
      if (SAFE_CEREBRAS_MODELS.has(modelId)) return modelId
      return "qwen-3-32b"
    }

    function resolveModelId(selected: string | undefined, userText: string) {
      if (shouldUseCerebrasForCode) {
        return { provider: "cerebras" as const, modelId: "zai-glm-4.6" }
      }

      if (!selected || selected === "auto") {
        return { provider: "together" as const, modelId: MODEL_REGISTRY["llama-3.3-70b"]["modelId"] }
      }
      const entry = MODEL_REGISTRY[selected]
      if (entry && "provider" in entry && entry.provider !== "auto") {
        if (entry.provider === "cerebras") {
          // For Cerebras models, if they are not safe, fallback to a default Together model
          if (SAFE_CEREBRAS_MODELS.has(selected)) {
            return entry
          } else {
            return { provider: "together" as const, modelId: MODEL_REGISTRY["llama-3.3-70b"]["modelId"] }
          }
        }
        return entry
      }
      // fallback
      return { provider: "together" as const, modelId: MODEL_REGISTRY["llama-3.3-70b"]["modelId"] }
    }

    const hasImage = messages.some((msg: any) => {
      const content = msg.content
      if (typeof content === "string") {
        return content.includes("[Attachment]") && content.includes("type: image")
      }
      return false
    })

    let newsArticles: any[] = []
    let weatherData: any = null
    let cryptoPrices: any[] = []
    let currencyRate: any = null
    let timeData: any = null
    let dataSourceContext = ""
    const allDebugInfo: any[] = []

    const needsNews = shouldFetchNews(userMessage)
    const needsWeather = shouldFetchWeather(userMessage)
    const needsCrypto = shouldFetchCrypto(userMessage)
    const needsCurrency = shouldFetchCurrency(userMessage)
    const needsTime = shouldFetchTime(userMessage)
    // Add new checks for IP info and Wikipedia
    const needsIPInfo = shouldFetchIPInfo(userMessage)
    const needsWikipedia = shouldFetchWikipedia(userMessage)
    let redditPosts: RedditPost[] = []
    let redditContext = ""

    const needsReddit = shouldFetchReddit(userMessage)

    if (needsNews) {
      const newsQuery = extractNewsQuery(userMessage)
      const newsResponse = await fetchNews(newsQuery)
      newsArticles = newsResponse.articles
      allDebugInfo.push(...newsResponse.debugInfo)
      if (newsArticles.length > 0) {
        dataSourceContext +=
          "\n\n=== LIVE NEWS ARTICLES ===\n" +
          newsArticles
            .map(
              (article, index) =>
                "[" +
                (index + 1) +
                "] " +
                article.title +
                "\n    " +
                article.description +
                "\n    Source: " +
                article.source +
                "\n    Published: " +
                article.publishedAt +
                "\n    URL: " +
                article.url,
            )
            .join("\n\n")
      }
    }

    if (needsWeather) {
      let location = extractLocation(userMessage)
      // If user provided location via geolocation and no specific location in message, use geolocation
      if (userLocation && !userMessage.match(/weather\s+(in|at|for)\s+[a-z]/i)) {
        location = userLocation
      }
      const weatherResponse = await fetchWeather(location)
      weatherData = weatherResponse.weather
      allDebugInfo.push(...weatherResponse.debugInfo)
      if (weatherData) {
        dataSourceContext += "\n\n=== LIVE WEATHER DATA ===\n"
        dataSourceContext +=
          "Location: " +
          weatherData.location +
          "\nTemperature: " +
          weatherData.temperature +
          "°C (Feels like: " +
          weatherData.feelsLike +
          "°C)\nCondition: " +
          weatherData.condition +
          "\nHumidity: " +
          weatherData.humidity +
          "%\nWind Speed: " +
          weatherData.windSpeed +
          " km/h\nLast Updated: " +
          weatherData.timestamp +
          "\n"
      }
    }

    if (needsCrypto) {
      const symbols = extractCryptoSymbols(userMessage)
      const cryptoResponse = await fetchCrypto(symbols)
      cryptoPrices = cryptoResponse.prices
      allDebugInfo.push(...cryptoResponse.debugInfo)
      if (cryptoPrices.length > 0) {
        dataSourceContext +=
          "\n\n=== LIVE CRYPTOCURRENCYPRICES ===\n" +
          cryptoPrices
            .map(
              (crypto) =>
                crypto.name +
                " (" +
                crypto.symbol +
                ")\n    Price: $" +
                crypto.price.toLocaleString() +
                "\n    24h Change: " +
                (crypto.priceChange24h >= 0 ? "+" : "") +
                crypto.priceChange24h.toFixed(2) +
                "\n    Market Cap: $" +
                crypto.marketCap.toLocaleString() +
                "\n    24h Volume: $" +
                crypto.volume24h.toLocaleString() +
                "\n    Last Updated: " +
                crypto.lastUpdated,
            )
            .join("\n\n")
      }
    }

    if (needsCurrency) {
      const { from, to } = extractCurrencyPair(userMessage)
      const currencyResponse = await fetchCurrencyRate(from, to)
      currencyRate = currencyResponse.rate
      allDebugInfo.push(...currencyResponse.debugInfo)
      if (currencyRate) {
        dataSourceContext +=
          "\n\n=== LIVE CURRENCY EXCHANGE RATE ===\n" +
          "From: " +
          currencyRate.baseCurrency +
          "\nTo: " +
          currencyRate.targetCurrency +
          "\nRate: " +
          currencyRate.rate.toFixed(4) +
          "\nLast Updated: " +
          currencyRate.lastUpdated +
          "\n"
      }
    }

    if (needsTime) {
      let timezone = extractTimezone(userMessage)
      // If user provided location via geolocation and no specific timezone in message, use geolocation
      if (userLocation && !timezone) {
        timezone = userLocation
      }
      const timeResponse = await fetchTime(timezone)
      timeData = timeResponse.time
      allDebugInfo.push(...timeResponse.debugInfo)
      if (timeData) {
        dataSourceContext +=
          "\n\n=== CURRENT TIME & DATE ===\n" +
          "Timezone: " +
          timeData.timezone +
          "\nDate: " +
          timeData.date +
          "\nTime: " +
          timeData.time +
          "\nDay of Week: " +
          timeData.dayOfWeek +
          "\nDay of Year: " +
          timeData.dayOfYear +
          "\nWeek Number: " +
          timeData.weekNumber +
          "\nUTC Offset: " +
          timeData.utcOffset +
          "\n"
      }
    }

    // Fetch IP information
    let ipInfoData: any = null
    if (needsIPInfo) {
      const ipResponse = await fetchIPInfo()
      ipInfoData = ipResponse.ipInfo
      allDebugInfo.push(...ipResponse.debugInfo)
      if (ipInfoData) {
        dataSourceContext +=
          "\n\n=== IP INFORMATION ===\n" +
          "IP Address: " +
          ipInfoData.ip +
          "\nCity: " +
          ipInfoData.city +
          "\nRegion: " +
          ipInfoData.region +
          "\nCountry: " +
          ipInfoData.country +
          "\n"
      }
    }

    // Fetch Wikipedia summary
    let wikipediaSummary: any = null
    if (needsWikipedia) {
      const topic = extractWikipediaTopic(userMessage)
      const wikipediaResponse = await fetchWikipediaSummary(topic)
      wikipediaSummary = wikipediaResponse.summary
      allDebugInfo.push(...wikipediaResponse.debugInfo)
      if (wikipediaSummary) {
        dataSourceContext +=
          "\n\n=== WIKIPEDIA SUMMARY ===\n" + "Topic: " + topic + "\nSummary: " + wikipediaSummary + "\n"
      }
    }

    if (needsReddit) {
      const subreddit = extractRedditSubreddit(userMessage)
      const redditResponse = await fetchReddit(subreddit)
      redditPosts = redditResponse.posts
      allDebugInfo.push(...redditResponse.debugInfo)

      if (redditPosts.length > 0) {
        redditContext =
          "\n\n=== REDDIT TRENDING POSTS ===\n" +
          redditPosts
            .map(
              (post, index) =>
                `[${index + 1}] ${post.title}\n    Subreddit: r/${post.subreddit}\n    Score: ${post.score}\n    Author: u/${post.author}\n    Posted: ${post.createdAt}\n    Upvote Ratio: ${(post.upvoteRatio * 100).toFixed(1)}%\n    URL: ${post.url}`,
            )
            .join("\n\n")
      }
    }

    let searchResults: any[] = []
    let searchContext = ""
    let didSearch = false

    const willSearch = shouldPerformWebSearch(userMessage)

    if (willSearch) {
      const todayDate = getTodayDate()
      const searchQuery = extractCleanQuery(userMessage)
      const todaySearchQuery = `${todayDate} ${searchQuery}`

      didSearch = true

      allDebugInfo.push({
        type: "search",
        message: "📅 Searching for today's information first...",
        data: { todayDate, query: searchQuery, timestamp: new Date().toISOString() },
      })

      try {
        // First search with today's date
        const searchResponse = await searchWebJSON(todaySearchQuery)
        searchResults = searchResponse.results.slice(0, 5) // Get 2-3 days old data

        // If no results with today's date, try broader search
        if (searchResults.length === 0) {
          allDebugInfo.push({
            type: "search",
            message: "No results for today's date, trying broader search...",
            data: { query: searchQuery, timestamp: new Date().toISOString() },
          })
          const broaderResponse = await searchWebJSON(searchQuery)
          searchResults = broaderResponse.results.slice(0, 5)
        }

        allDebugInfo.push(...searchResponse.debugInfo)

        if (searchResults.length > 0) {
          searchContext =
            "\n\n=== LIVE WEB SEARCH RESULTS ===\n" +
            'Query: "' +
            searchQuery +
            '"\n\n' +
            searchResults
              .map(
                (result, index) =>
                  "[" +
                  (index + 1) +
                  "] " +
                  result.title +
                  "\n    " +
                  result.snippet +
                  "\n    Source: " +
                  result.url +
                  "\n    Domain: " +
                  result.domain +
                  "\n    Relevance: " +
                  (result.relevance * 100).toFixed(0) +
                  "%",
              )
              .join("\n\n")

          allDebugInfo.push({
            type: "search",
            message: `✅ Found ${searchResults.length} search results`,
            data: { count: searchResults.length, query: searchQuery },
          })
        } else {
          allDebugInfo.push({
            type: "error",
            message: "⚠️ Web search returned no results",
            data: { query: searchQuery },
          })
        }
      } catch (searchError) {
        allDebugInfo.push({
          type: "error",
          message: "❌ Web search failed",
          data: {
            error: searchError instanceof Error ? searchError.message : String(searchError),
            query: searchQuery,
          },
        })
      }
    }

    // Memory: get user and load memories
    const supabase = await createSupabaseServer()
    const {
      data: { user: sbUser },
      error: sbUserError,
    } = await supabase.auth.getUser()

    let selectedAvatar: any = null
    if (sbUser && !sbUserError) {
      const { data: avatarData } = await supabase
        .from("user_selected_avatar")
        .select("avatar_id, is_selected")
        .eq("user_id", sbUser.id)
        .eq("is_selected", true)
        .maybeSingle()

      if (avatarData?.avatar_id && avatarData.is_selected === true) {
        const { data: avatar } = await supabase.from("avatars").select("*").eq("id", avatarData.avatar_id).maybeSingle()

        if (avatar) {
          selectedAvatar = avatar
        }
      }
    }

    if (!sbUser || sbUserError) {
      allDebugInfo.push({
        type: "error",
        message: "User not authenticated; memory is disabled for this session",
        data: { error: sbUserError?.message, hint: "Sign in to enable memory & chat history" },
      })
    }

    let memoryContext = ""
    if (sbUser) {
      const { data: mems, error: memErr } = await supabase
        .from("user_memories")
        .select("*")
        .eq("user_id", sbUser.id)
        .order("created_at", { ascending: false })

      if (memErr) {
        allDebugInfo.push({
          type: "error",
          message: "Failed to load user memories",
          data: { error: memErr.message },
        })
      }

      if (mems && mems.length) {
        const lines = mems.map((m) => `- ${m.key}: ${m.value}`)
        memoryContext = "\n\n=== USER MEMORY ===\n" + lines.join("\n")
      }
    }

    // Detect new memory from latest user message
    type PendingMemory = { key: "name" | "occupation" | "note"; value: string; category: string } | null
    let newMemory: PendingMemory = null
    if (sbUser && typeof userMessage === "string") {
      const nameMatch =
        userMessage.match(/\b(?:my name is|call me)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})\b/) ||
        userMessage.match(/\bI am\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})\b/)
      if (nameMatch) {
        const val = nameMatch[1].trim()
        if (val.length >= 2 && val.length <= 60) newMemory = { key: "name", value: val, category: "name" }
      }
      if (!newMemory) {
        const occMatch = userMessage.match(
          /\b(?:i am|i'm|i am a|i'm a|i work as|my profession is)\s+([a-z][a-z\s-]{2,40})\b/i,
        )
        if (occMatch) {
          const val = occMatch[1].trim()
          if (val && /^[a-z\s-]+$/i.test(val)) newMemory = { key: "occupation", value: val, category: "occupation" }
        }
      }
      // New: generic note capture
      if (!newMemory) {
        const noteMatch =
          userMessage.match(/\b(?:remember that|remember:)\s+(.{2,200})$/i) ||
          userMessage.match(/\b(?:save (?:this )?note:|add (?:a )?note:)\s+(.{2,200})$/i)
        if (noteMatch) {
          const val = noteMatch[1].trim()
          if (val.length >= 2 && val.length <= 200) {
            newMemory = { key: "note", value: val, category: "note" }
          }
        }
      }
    }

    let memoryPrefixText = ""
    if (sbUser && newMemory) {
      try {
        await supabase
          .from("user_memories")
          .upsert(
            { user_id: sbUser.id, key: newMemory.key, value: newMemory.value, category: newMemory.category },
            { onConflict: "user_id,key" },
          )

        memoryPrefixText = `💾 Saved to memory: ${newMemory.key} = ${newMemory.value}\n\n`
        memoryContext += (memoryContext ? "\n" : "\n\n=== USER MEMORY ===\n") + `- ${newMemory.key}: ${newMemory.value}`

        // stream a small debug signal for transparency
        allDebugInfo.push({
          type: "ai",
          message: "Memory saved",
          data: { key: newMemory.key, value: newMemory.value },
        })
      } catch (memUpsertErr: any) {
        allDebugInfo.push({
          type: "error",
          message: "Failed to upsert user memory",
          data: { error: memUpsertErr?.message || String(memUpsertErr) },
        })
      }
    }

    const textChoice = resolveModelId(model, userMessage)
    const requestedModel = textChoice.modelId
    const togetherModel =
      textChoice.provider === "together" ? textChoice.modelId : MODEL_REGISTRY["llama-3.3-70b"]["modelId"]
    const selectedModel = model || "auto"

    const structureHint = ""

    const currentDate = new Date()
    const dateString = currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const customInstructionsSection = customInstructions
      ? "\n\n🟢 **CUSTOM USER INSTRUCTIONS** 🟢\n" +
        "The user has provided the following custom instructions that you MUST follow in all conversations:\n\n" +
        customInstructions +
        "\n\n🟢 **END OF CUSTOM INSTRUCTIONS** 🟢\n\n" +
        "These instructions take priority and should be applied to all your responses.\n\n"
      : ""

    const avatarSection = selectedAvatar
      ? "\n\n🎭 **AVATAR PERSONALITY** 🎭\n" +
        "You are embodying the following character:\n\n" +
        `**Character: ${selectedAvatar.name}**\n` +
        `**Created by: ${selectedAvatar.creator_name}**\n\n` +
        `${selectedAvatar.character_description || selectedAvatar.description}\n\n` +
        "Character Behavior Instructions:\n" +
        selectedAvatar.prompt +
        "\n\n🎭 **END OF CHARACTER** 🎭\n\n" +
        "Respond as this character would. Embody their personality, knowledge, and perspective in all your responses. You are not an AI assistant - you are this character.\n\n"
      : ""

    const systemPrompt =
      "You are Noxy AI, a helpful and intelligent AI assistant.\n\n" +
      "🌐 **ABOUT YOU**\n" +
      "- Website: www.noxyai.com\n" +
      "- Powered by: NoxyAI Team\n" +
      `- Current Date & Time: ${dateString}\n\n` +
      "Only mention your identity if the user specifically asks who you are or who created you. Otherwise, chat naturally without introducing yourself.\n\n" +
      "⏰ **CRITICAL: SEARCH RECENCY**\n" +
      "When you search for information, prioritize results from the LAST 2-3 DAYS. If the user asks about current events, news, weather, prices, or time-sensitive information:\n" +
      "- Always search for the latest information\n" +
      "- Use the most recent data available (preferably 2-3 days old or newer)\n" +
      "- Combine multiple sources for comprehensive coverage\n" +
      "- If information is older than 5 days, mention when it was last updated\n\n" +
      "💻 **CODE GENERATION EXCELLENCE**\n" +
      "When generating code, you MUST follow these principles:\n\n" +
      (shouldShowCodePlan
        ? "🎯 **VIBE CODING MODE ACTIVE - PLANE FIRST WORKFLOW**\n" +
          "1. FIRST RESPONSE: Create a detailed PLANE section (NOT code) explaining:\n" +
          "   - What you will build\n" +
          "   - Architecture and structure\n" +
          "   - Key components and features\n" +
          "   - Technology choices and why\n" +
          "   - Implementation approach\n\n" +
          "2. Format your plane like this:\n" +
          "   ```\n" +
          "   PLANE:\n" +
          "   - Component 1: Description\n" +
          "   - Component 2: Description\n" +
          "   - Features: List\n" +
          "   - Tech Stack: List\n" +
          "   ```\n\n" +
          "3. End with: 'Ready to generate? Say OK to proceed with the full code.'\n\n" +
          "4. WAIT for user approval (they will say 'OK' or 'Approve')\n\n" +
          "5. SECOND RESPONSE: After user approves, generate the FULL CODE with:\n" +
          "   - Complete implementations\n" +
          "   - All imports and dependencies\n" +
          "   - Proper error handling\n" +
          "   - Responsive design\n" +
          "   - Modern UI patterns\n\n"
        : "") +
      "1. **COMPLETE IMPLEMENTATIONS**: Always provide full, production-ready code. Never use placeholders like '// rest of code here' or '// implement this'. Write every function, every component, every line.\n\n" +
      "2. **MODERN BEST PRACTICES**:\n" +
      "   - React: Use functional components, hooks (useState, useEffect, useCallback, useMemo), proper TypeScript types\n" +
      "   - Next.js: Use App Router, Server Components by default, Client Components only when needed ('use client')\n" +
      "   - Styling: Use Tailwind CSS with modern utility classes, responsive design (sm:, md:, lg:, xl:)\n" +
      "   - TypeScript: Proper type definitions, interfaces, generics where appropriate\n" +
      "   - Performance: Optimize with React.memo, lazy loading, code splitting\n\n" +
      "3. **COMPREHENSIVE UI COMPONENTS**:\n" +
      "   - Include all imports and dependencies\n" +
      "   - Add proper error handling and loading states\n" +
      "   - Implement responsive design for mobile, tablet, desktop\n" +
      "   - Use modern UI patterns: glassmorphism, animations, transitions\n" +
      "   - Add accessibility features (ARIA labels, keyboard navigation)\n\n" +
      "4. **DEEP TECHNICAL IMPLEMENTATION**:\n" +
      "   - Write complete API routes with proper error handling\n" +
      "   - Include database queries, authentication logic, validation\n" +
      "   - Add comprehensive comments explaining complex logic\n" +
      "   - Implement proper state management patterns\n" +
      "   - Include edge cases and error scenarios\n\n" +
      "5. **CODE QUALITY**:\n" +
      "   - Follow clean code principles\n" +
      "   - Use meaningful variable and function names\n" +
      "   - Proper code organization and structure\n" +
      "   - Add JSDoc comments for complex functions\n" +
      "   - Include type safety throughout\n\n" +
      "6. **MODERN UI/UX PATTERNS - GLASMORPHISM & COLORFUL DESIGNS**:\n" +
      "   - Use glassmorphism effects: backdrop-blur, semi-transparent backgrounds, border effects\n" +
      "   - Implement vibrant, colorful gradients: use multiple colors (purple, blue, pink, cyan, orange)\n" +
      "   - Add smooth animations with CSS transitions and keyframes\n" +
      "   - Create custom SVG logos and icons with colorful designs\n" +
      "   - Use gradient text effects and colorful shadows\n" +
      "   - Implement hover effects with scale, rotate, and color transitions\n" +
      "   - Add particle effects, floating elements, and dynamic backgrounds\n" +
      "   - Use CSS Grid and Flexbox for modern layouts\n" +
      "   - Implement loading skeletons and optimistic UI updates\n" +
      "   - Toast notifications with colorful designs\n" +
      "   - Modal dialogs with glassmorphism effects\n" +
      "   - Form validation with clear, colorful error messages\n" +
      "   - Dark mode support with adjusted color schemes\n" +
      "   - Add decorative elements that enhance the design\n\n" +
      "7. **LOGO & BRANDING ELEMENTS**:\n" +
      "   - Generate custom SVG logos with colorful gradients\n" +
      "   - Create brand-specific icons and visual elements\n" +
      "   - Use CSS animations for logo effects (rotate, pulse, glow)\n" +
      "   - Implement favicon and brand colors throughout\n" +
      "   - Add decorative elements that enhance the design\n\n" +
      "8. **CODE LENGTH & COMPLETENESS**:\n" +
      "   - Generate MINIMUM 1000+ lines of code for any app request\n" +
      "   - Include complete HTML, CSS, and JavaScript in single code blocks\n" +
      "   - Add multiple features and variations\n" +
      "   - Implement advanced functionality beyond basic requirements\n" +
      "   - Include detailed comments and documentation\n" +
      "   - Add bonus features that impress users\n" +
      "   - Generate at least 1500+ lines for any meaningful app\n" +
      "   - Use modern frameworks and libraries (React, Vue, Svelte, etc.)\n" +
      "   - Implement glasmorphism, gradients, and colorful designs by default\n" +
      "   - Add custom SVG logos and branding elements\n" +
      "   - Create impressive, polished user experiences\n\n" +
      "9. **CRITICAL: AVOID BASIC CODE - ALWAYS GENERATE SOPHISTICATED IMPLEMENTATIONS**:\n" +
      "   - NEVER generate simple, basic, or minimal code\n" +
      "   - ALWAYS create production-ready, feature-rich implementations\n" +
      "   - Include advanced features like:\n" +
      "     * Real-time data updates and live previews\n" +
      "     * Advanced animations and transitions\n" +
      "     * Complex state management and data handling\n" +
      "     * Multiple interactive components and sections\n" +
      "     * Advanced CSS effects (gradients, shadows, filters, transforms)\n" +
      "     * Comprehensive error handling and edge cases\n" +
      "     * Performance optimizations and best practices\n" +
      "     * Accessibility features (ARIA, keyboard navigation, screen readers)\n" +
      "     * Responsive design for all screen sizes\n" +
      "     * Dark mode and theme switching\n" +
      "     * Advanced form handling with validation\n" +
      "     * Data visualization and charts\n" +
      "     * Search, filter, sort, and pagination\n" +
      "     * Export/import functionality\n" +
      "     * Local storage and persistence\n" +
      "     * Keyboard shortcuts and advanced interactions\n" +
      "   - If user asks for a simple app, EXPAND it with bonus features\n" +
      "   - Generate at least 1500+ lines for any meaningful app\n" +
      "   - Use modern frameworks and libraries (React, Vue, Svelte, etc.)\n" +
      "   - Implement glasmorphism, gradients, and colorful designs by default\n" +
      "   - Add custom SVG logos and branding elements\n" +
      "   - Create impressive, polished user experiences\n\n" +
      "10. **COMPREHENSIVE EXAMPLES**:\n" +
      "   - When showing how to use code, provide complete working examples\n" +
      "   - Include setup instructions and dependencies\n" +
      "   - Show multiple use cases and variations\n" +
      "   - Explain the reasoning behind architectural decisions\n\n" +
      customInstructionsSection +
      avatarSection +
      memoryContext +
      "\n\nYou may use USER MEMORY to personalize your responses." +
      "\n\n🔴 CRITICAL RESPONSE GUIDELINES 🔴\n\n" +
      "1. **NO DISCLAIMERS**: Never mention 'knowledge cutoff', 'as of my last update', 'according to my training data', or similar phrases. Just answer directly.\n\n" +
      "2. **NO DATE STAMPS**: Never include timestamps like 'As of [date]' or 'Current as of [time]' in your responses. The user doesn't need to see this.\n\n" +
      "3. **SEARCH FIRST**: For any question that might need current information, you will automatically search the web. Use those real results to answer.\n\n" +
      "4. **CREATE YOUR OWN ANALYSIS**: Don't just repeat search results. Read them, understand them, analyze them, and create your own comprehensive report in your own words.\n\n" +
      "5. **BE CONFIDENT**: Write as if you know the information directly. Don't say 'according to...' or 'based on...'. Just state the facts naturally.\n\n" +
      "6. **SYNTHESIZE INFORMATION**: When you get multiple sources, combine them intelligently. Find patterns, compare perspectives, and give a complete picture.\n\n" +
      "7. **NO SOURCE CITATIONS IN TEXT**: Don't mention URLs or source names in your response. Sources are shown separately in a popup.\n\n" +
      (redditContext ||
      newsArticles.length > 0 ||
      weatherData !== null ||
      cryptoPrices.length > 0 ||
      currencyRate !== null ||
      timeData !== null ||
      ipInfoData !== null || // Added IP info
      wikipediaSummary !== null || // Added Wikipedia
      (didSearch && searchResults.length > 0)
        ? "✅ LIVE DATA AVAILABLE - Use this information to answer the user's question:\n\n" +
          redditContext +
          dataSourceContext +
          searchContext +
          "\n\n=== END OF LIVE DATA ===\n\n" +
          "**YOUR TASK**: Analyze the live data above and create a comprehensive, natural response. Don't just repeat the data - understand it, find insights, make connections, and present it in a clear, engaging way. Write as if you're an expert explaining the topic, not a bot reading search results."
        : // Always search for today's date first, then perform web search
          "🌐 **WEB SEARCH CAPABILITY**\n\n" +
          "You have access to real-time web search powered by Google. When users ask about current events, the system will automatically search the web with TODAY'S DATE first, then broader searches for 2-3 day old data.")

    let stream: any
    try {
      if (hasImage) {
        allDebugInfo.push({
          type: "ai",
          message: "🔍 Analyzing images with Together AI Vision Model...",
          data: { model: "google/gemma-3n-E4B-it", timestamp: new Date().toISOString() },
        })

        // Extract all images and analyze them with Together AI vision model
        const imageDescriptions: string[] = []

        for (const msg of messages) {
          const content = msg.content
          if (typeof content === "string" && content.includes("[Attachment]") && content.includes("type: image")) {
            const userQuestion = content.split("[Attachment]")[0].trim()
            const dataUrlMatches = content.matchAll(/- data:\s*(data:image\/[a-zA-Z+.-]+;base64,[^\r\n]+)/g)

            for (const match of dataUrlMatches) {
              const dataUrl = match[1]
              if (dataUrl) {
                // Use Together AI vision model to analyze image
                const visionMessages = [
                  {
                    role: "user" as const,
                    content: [
                      {
                        type: "text" as const,
                        text: userQuestion || "Describe this image in detail.",
                      },
                      {
                        type: "image_url" as const,
                        image_url: { url: dataUrl },
                      },
                    ],
                  },
                ]

                const visionStream = await createTogetherVisionStream(visionMessages, "google/gemma-3n-E4B-it", {
                  temperature: 0.7,
                  top_p: 0.9,
                  max_tokens: 2048,
                })

                let analysis = ""
                for await (const chunk of parseTogetherStream(visionStream)) {
                  const content = chunk.choices[0]?.delta?.content || ""
                  analysis += content
                }

                imageDescriptions.push(analysis)

                allDebugInfo.push({
                  type: "ai",
                  message: "✅ Image analyzed successfully",
                  data: { descriptionLength: analysis.length },
                })
              }
            }
          }
        }

        // Build image context for the selected model
        let imageContext = ""
        if (imageDescriptions.length > 0) {
          imageContext = "\n\n=== IMAGE ANALYSIS (from Vision Model) ===\n"
          imageDescriptions.forEach((desc, i) => {
            const imageNumber = imageDescriptions.length > 1 ? ` ${i + 1}` : ""
            imageContext += `Image${imageNumber}: ${desc}\n\n`
          })
          imageContext += "=== END IMAGE ANALYSIS ===\n\n"
          imageContext +=
            "The user has uploaded image(s). The vision model has analyzed them above. Use this analysis to answer their question accurately.\n\n"
        }

        // Extract text messages (without attachment metadata)
        const textMessages = messages.map((msg: any) => {
          const content = msg.content
          if (typeof content === "string" && content.includes("[Attachment]")) {
            return {
              role: msg.role,
              content: content.split("[Attachment]")[0].trim(),
            }
          }
          return { role: msg.role, content: msg.content }
        })

        const enhancedSystemPrompt = systemPrompt + imageContext
        const chatMessages = [{ role: "system", content: enhancedSystemPrompt }, ...textMessages]

        allDebugInfo.push({
          type: "ai",
          message: `🤖 Using selected model: ${model || "auto"} (${textChoice.provider})`,
          data: { model: textChoice.modelId, provider: textChoice.provider },
        })

        // Use the user's selected model (forced to Together AI since Cerebras key is invalid)
        const streamBody = await createTogetherStream(chatMessages as any, togetherModel, {
          temperature: dynamicTemperature,
          top_p: 1,
          max_tokens: 8000,
        })
        if (!streamBody) throw new Error("Failed to create Together stream")
        stream = parseTogetherStream(streamBody)

        // Stream the response
        const encoder = new TextEncoder()
        const readable = new ReadableStream({
          async start(controller) {
            try {
              // Send debug info
              for (const debugItem of allDebugInfo) {
                const debugMsg = JSON.stringify({
                  choices: [{ delta: { content: "", debugInfo: debugItem } }],
                })
                controller.enqueue(encoder.encode("data: " + debugMsg + "\n\n"))
              }

              // Send search results if any
              if (searchResults.length > 0) {
                const searchMsg = JSON.stringify({
                  choices: [{ delta: { searchResults, searchPerformed: true } }],
                })
                controller.enqueue(encoder.encode("data: " + searchMsg + "\n\n"))
              }

              // Stream text model response
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || ""
                if (content) {
                  controller.enqueue(
                    encoder.encode("data: " + JSON.stringify({ choices: [{ delta: { content } }] }) + "\n\n"),
                  )
                }
              }

              controller.enqueue(encoder.encode("data: [DONE]\n\n"))
              controller.close()
            } catch (error) {
              const errorDebug = JSON.stringify({
                choices: [
                  {
                    delta: {
                      content: "",
                      debugInfo: {
                        type: "error",
                        message: "Something went wrong",
                        data: {
                          timestamp: new Date().toISOString(),
                        },
                      },
                    },
                  },
                ],
              })
              controller.enqueue(encoder.encode("data: " + errorDebug + "\n\n"))
              controller.error(error)
            }
          },
        })

        return new Response(readable, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
        })
      } else if (deepSearch) {
        // Build chat messages once
        const chatMessages = messages as any

        // Decide which providers to include in parallel deep passes
        const includeCerebras = true // we include to capture coding/structured strengths
        const includeTogether = true // we include to capture general reasoning

        const safeRequestedModel =
          textChoice.provider === "cerebras" ? sanitizeCerebrasModel(requestedModel) : requestedModel

        const deepSearchResult = await gatherDeepPasses({
          systemPrompt,
          messages: chatMessages,
          togetherModel,
          cerebrasModel: sanitizeCerebrasModel(safeRequestedModel),
          includeTogether,
          includeCerebras,
          userQuery: userMessage, // Added user query
        })

        const {
          responses,
          summary,
          searchResults: deepSearchResults,
          searchContext: deepSearchContext,
        } = deepSearchResult

        if (responses.length === 0) {
          throw new Error("All deep think passes failed")
        }

        if (deepSearchResults && deepSearchResults.length > 0) {
          allDebugInfo.push({
            type: "search",
            message: `🌐 Deep Search found ${deepSearchResults.length} web results`,
            data: { count: deepSearchResults.length, timestamp: new Date().toISOString() },
          })
        }

        // Synthesis provider: prefer Cerebras for code tasks, otherwise Together
        const preferCerebras = isCodeTask(userMessage) || textChoice.provider === "cerebras"
        const synthesisPrompt = buildSynthesisPrompt(userMessage, responses)

        let synthStream: ReadableStream<Uint8Array> | null = null

        if (preferCerebras) {
          try {
            const chosen = sanitizeCerebrasModel(safeRequestedModel)
            const body = await createCerebrasStream(
              [
                { role: "system", content: systemPrompt + (deepSearchContext || "") },
                { role: "user", content: synthesisPrompt },
              ] as any,
              chosen,
              {
                temperature: dynamicTemperature,
                top_p: 1,
                max_completion_tokens: shouldUseCerebrasForCode ? 40000 : 12000,
              },
            )
            synthStream = body
            stream = parseCerebrasStream(synthStream!)
          } catch (err: any) {
            const msg = err?.message || ""
            if (/model.*not.*found|404/i.test(msg)) {
              const body = await createCerebrasStream(
                [
                  { role: "system", content: systemPrompt + (deepSearchContext || "") },
                  { role: "user", content: synthesisPrompt },
                ] as any,
                "qwen-3-32b",
                {
                  temperature: dynamicTemperature,
                  top_p: 1,
                  max_completion_tokens: shouldUseCerebrasForCode ? 40000 : 12000,
                },
              )
              synthStream = body
              stream = parseCerebrasStream(synthStream!)
              allDebugInfo.push({
                type: "error",
                message: "Cerebras model unavailable; fell back to qwen-3-32b (synthesis)",
                data: { originalModel: safeRequestedModel },
              })
            } else {
              throw err
            }
          }
        } else {
          const body = await createTogetherStream(
            [
              { role: "system", content: systemPrompt + (deepSearchContext || "") },
              { role: "user", content: synthesisPrompt },
            ] as any,
            togetherModel,
            {
              temperature: dynamicTemperature,
              top_p: 1,
              max_tokens: 8000,
            },
          )
          synthStream = body
          stream = parseTogetherStream(synthStream!)
        }

        const encoder = new TextEncoder()
        const readable = new ReadableStream({
          async start(controller) {
            const debugMsg = JSON.stringify({
              choices: [
                {
                  delta: {
                    content: "",
                    debugInfo: {
                      type: "ai",
                      message: summary,
                      data: { timestamp: new Date().toISOString() },
                    },
                  },
                },
              ],
            })
            controller.enqueue(encoder.encode("data: " + debugMsg + "\n\n"))

            if (deepSearchResults && deepSearchResults.length > 0) {
              const searchMsg = JSON.stringify({
                choices: [{ delta: { searchResults: deepSearchResults, searchPerformed: true } }],
              })
              controller.enqueue(encoder.encode("data: " + searchMsg + "\n\n"))
            }

            for await (const chunk of stream) {
              const raw = chunk.choices?.[0]?.delta?.content || ""
              if (!raw) continue

              controller.enqueue(
                encoder.encode("data: " + JSON.stringify({ choices: [{ delta: { content: raw } }] }) + "\n\n"),
              )
            }

            const modelsUsed = responses.map((r) => r.model).join(", ")
            const footer = `\n\n---\n\n*Deep Think used: ${modelsUsed}*`
            controller.enqueue(
              encoder.encode("data: " + JSON.stringify({ choices: [{ delta: { content: footer } }] }) + "\n\n"),
            )

            controller.enqueue(encoder.encode("data: [DONE]\n\n"))
            controller.close()
          },
        })
        return new Response(readable, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
        })
      } else {
        const chatMessages = [{ role: "system", content: systemPrompt }, ...messages]
        const modelToUse = textChoice.provider === "groq" ? textChoice.modelId : sanitizeCerebrasModel(requestedModel)

        const isReasoningModel =
          /-thinking-/i.test(modelToUse) || /deepseek-r1/i.test(modelToUse) || textChoice.provider === "nvidia"
        const reasoning_effort = isReasoningModel ? "medium" : undefined

        if (textChoice.provider === "nvidia") {
          allDebugInfo.push({
            type: "ai",
            message: `Using NVIDIA model with reasoning`,
            data: { model: textChoice.modelId, provider: "nvidia", timestamp: new Date().toISOString() },
          })

          const streamBody = await createNvidiaDeepSeekStream(
            chatMessages as any,
            textChoice.modelId, // Pass the actual model ID
            {
              temperature: dynamicTemperature,
              top_p: 0.7,
              max_tokens: 8192,
              reasoning_effort: "medium",
              chat_template_kwargs: { thinking: true }, // Enable thinking for all NVIDIA models
            },
          )

          if (!streamBody) throw new Error("Failed to create NVIDIA DeepSeek stream")
          stream = parseNvidiaStream(streamBody)
        } else if (textChoice.provider === "cerebras") {
          let streamBody: any
          try {
            streamBody = await createCerebrasStream(chatMessages as any, modelToUse, {
              temperature: dynamicTemperature,
              top_p: 1,
              max_completion_tokens: isReasoningModel ? 20000 : shouldUseCerebrasForCode ? 40000 : 12000,
              reasoning_effort,
            })
          } catch (err: any) {
            const msg = err?.message || ""
            if (/model.*not.*found|404/i.test(msg)) {
              streamBody = await createCerebrasStream(chatMessages as any, "qwen-3-32b", {
                temperature: dynamicTemperature,
                top_p: 1,
                max_completion_tokens: shouldUseCerebrasForCode ? 40000 : 12000,
              })
              allDebugInfo.push({
                type: "error",
                message: "Cerebras model unavailable; fell back to qwen-3-32b",
                data: { requestedModel: modelToUse },
              })
            } else {
              throw err
            }
          }
          if (!streamBody) throw new Error("Failed to create Cerebras stream")
          stream = parseCerebrasStream(streamBody)
        } else if (textChoice.provider === "groq") {
          const Groq = (await import("@ai-sdk/groq")).groq
          const groqClient = Groq(modelToUse) // Use modelToUse here

          const { stream: groqStream } = await groqClient.doStream({
            messages: chatMessages,
            system: `You are a helpful AI assistant. Today's date is ${new Date().toLocaleDateString()}. When the user asks about current events, latest news, weather, time, or any real-time information, provide the most recent information available (within the last 2-3 days). Always be helpful and accurate.`,
            temperature: dynamicTemperature,
            maxTokens: 4096,
          })

          stream = parseGroqStream(groqStream)

          allDebugInfo.push({
            type: "ai",
            message: `Using Groq model: ${modelToUse}`,
            data: { model: modelToUse, provider: "groq", timestamp: new Date().toISOString() },
          })
        } else if (textChoice.provider === "noxyai") {
          const noxyResponse = await createNoxyAICompletion(chatMessages as any, requestedModel, {
            temperature: dynamicTemperature,
            top_p: 1,
            max_tokens: 4096,
          })

          allDebugInfo.push({
            type: "ai",
            message: `🚀 Using NoxyAI (supernoxy.v1) with automatic web search`,
            data: { model: "supernoxy.v1", provider: "noxyai", timestamp: new Date().toISOString() },
          })

          // Get the full content from the response
          const fullContent = noxyResponse.choices[0]?.message?.content || ""

          // Create an async generator to simulate streaming for better UX
          stream = (async function* () {
            const chunkSize = 50 // Characters per chunk
            for (let i = 0; i < fullContent.length; i += chunkSize) {
              const chunk = fullContent.slice(i, i + chunkSize)
              yield {
                choices: [
                  {
                    delta: {
                      content: chunk,
                    },
                    finish_reason: i + chunkSize >= fullContent.length ? "stop" : null,
                  },
                ],
              }
              // Small delay to simulate natural streaming
              await new Promise((resolve) => setTimeout(resolve, 20))
            }
          })()
        } else {
          const streamBody = await createTogetherStream(chatMessages as any, togetherModel, {
            temperature: dynamicTemperature,
            top_p: 1,
            max_tokens: 8000,
          })
          if (!streamBody) throw new Error("Failed to create Together stream")
          stream = parseTogetherStream(streamBody)
        }
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e)
      const errorStack = e instanceof Error ? e.stack : undefined

      console.error("[v0] Chat API Error:", {
        message: errorMsg,
        stack: errorStack,
        timestamp: new Date().toISOString(),
      })

      const body = {
        error: "Something went wrong. Please try again.",
        details: errorMsg,
        stack: errorStack,
        timestamp: new Date().toISOString(),
      }

      return new Response(JSON.stringify(body), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const encoder = new TextEncoder()

    const isReasoningModel =
      /-thinking-/i.test(requestedModel) || /deepseek-r1/i.test(requestedModel) || textChoice.provider === "nvidia"

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for (const debugItem of allDebugInfo) {
            const debugMsg = JSON.stringify({
              choices: [{ delta: { content: "", debugInfo: debugItem } }],
            })
            controller.enqueue(encoder.encode("data: " + debugMsg + "\n\n"))
          }

          if (searchResults.length > 0) {
            const searchMsg = JSON.stringify({
              choices: [{ delta: { searchResults, searchPerformed: true } }],
            })
            controller.enqueue(encoder.encode("data: " + searchMsg + "\n\n"))
          }

          let totalTokens = 0
          let chunkCount = 0

          if (isReasoningModel) {
            let fullContent = ""
            let inThinkTag = false
            let thinkingContent = ""
            let answerContent = ""
            let tagBuffer = ""

            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || ""
              const reasoning = chunk.choices[0]?.delta?.thinking || "" // Renamed from reasoning to thinking

              // If we get thinking directly from the stream (nvidia format)
              if (reasoning) {
                thinkingContent += reasoning
                controller.enqueue(
                  encoder.encode(
                    "data: " +
                      JSON.stringify({
                        choices: [{ delta: { thinking: reasoning } }], // Changed to 'thinking'
                      }) +
                      "\n\n",
                  ),
                )
              }

              if (content) {
                fullContent += content

                // Process character by character to handle partial tags
                for (let i = 0; i < content.length; i++) {
                  const char = content[i]
                  tagBuffer += char

                  // Check for opening tag - case insensitive, exact match only
                  if (tagBuffer.toLowerCase().endsWith("<Thinking>")) {
                    inThinkTag = true
                    const idx = tagBuffer.toLowerCase().lastIndexOf("<Thinking>")
                    const beforeTag = tagBuffer.substring(0, idx)
                    if (beforeTag) {
                      answerContent += beforeTag
                      controller.enqueue(
                        encoder.encode(
                          "data: " +
                            JSON.stringify({
                              choices: [{ delta: { content: beforeTag } }],
                            }) +
                            "\n\n",
                        ),
                      )
                    }
                    tagBuffer = ""
                    continue
                  }

                  // Check for closing tag - case insensitive, exact match only
                  if (tagBuffer.toLowerCase().endsWith("</Thinking>")) {
                    inThinkTag = false
                    const idx = tagBuffer.toLowerCase().lastIndexOf("</Thinking>")
                    const thinkText = tagBuffer.substring(0, idx)
                    if (thinkText) {
                      thinkingContent += thinkText
                      controller.enqueue(
                        encoder.encode(
                          "data: " +
                            JSON.stringify({
                              choices: [{ delta: { thinking: thinkText } }], // Changed to 'thinking'
                            }) +
                            "\n\n",
                        ),
                      )
                    }
                    tagBuffer = ""
                    continue
                  }

                  // If buffer is getting long without finding a tag, flush it
                  if (tagBuffer.length > 20 && !tagBuffer.includes("<")) {
                    if (inThinkTag) {
                      thinkingContent += tagBuffer
                      controller.enqueue(
                        encoder.encode(
                          "data: " +
                            JSON.stringify({
                              choices: [{ delta: { thinking: tagBuffer } }], // Changed to 'thinking'
                            }) +
                            "\n\n",
                        ),
                      )
                    } else {
                      answerContent += tagBuffer
                      controller.enqueue(
                        encoder.encode(
                          "data: " +
                            JSON.stringify({
                              choices: [{ delta: { content: tagBuffer } }],
                            }) +
                            "\n\n",
                        ),
                      )
                    }
                    tagBuffer = ""
                  }
                }

                totalTokens += content.length
                chunkCount++
              }
            }

            // Flush any remaining buffer
            if (tagBuffer) {
              if (inThinkTag) {
                controller.enqueue(
                  encoder.encode(
                    "data: " +
                      JSON.stringify({
                        choices: [{ delta: { thinking: tagBuffer } }], // Changed to 'thinking'
                      }) +
                      "\n\n",
                  ),
                )
              } else {
                controller.enqueue(
                  encoder.encode(
                    "data: " +
                      JSON.stringify({
                        choices: [{ delta: { content: tagBuffer } }],
                      }) +
                      "\n\n",
                  ),
                )
              }
            }
          } else {
            // Normal streaming for non-reasoning models
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || ""
              if (content) {
                totalTokens += content.length
                chunkCount++
                controller.enqueue(
                  encoder.encode("data: " + JSON.stringify({ choices: [{ delta: { content } }] }) + "\n\n"),
                )
              }
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (error) {
          const errorDebug = JSON.stringify({
            choices: [
              {
                delta: {
                  content: "",
                  debugInfo: {
                    type: "error",
                    message: "API Error: " + (error instanceof Error ? error.message : "Unknown error"),
                    data: {
                      error: error instanceof Error ? error.message : String(error),
                      stack: error instanceof Error ? error.stack : undefined,
                      timestamp: new Date().toISOString(),
                    },
                  },
                },
              },
            ],
          })
          controller.enqueue(encoder.encode("data: " + errorDebug + "\n\n"))
          controller.error(error)
        }
      },
    })

    return new Response(readable, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error("[v0] Chat API Error:", {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    })

    const body = {
      error: "Something went wrong. Please try again.",
      details: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    }

    return new Response(JSON.stringify(body), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
