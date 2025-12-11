// Trusted JSON-based data sources for news, weather, crypto, currency rate, and time/date
// Using free public APIs that don't require API keys

export interface NewsArticle {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  author?: string
}

export interface RedditPost {
  title: string
  subreddit: string
  score: number
  url: string
  author: string
  createdAt: string
  upvoteRatio: number
}

export interface WeatherData {
  location: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  feelsLike: number
  timestamp: string
}

export interface CryptoPrice {
  symbol: string
  name: string
  price: number
  priceChange24h: number
  priceChangePercent24h: number
  marketCap: number
  volume24h: number
  lastUpdated: string
}

export interface CurrencyRate {
  baseCurrency: string
  targetCurrency: string
  rate: number
  lastUpdated: string
}

export interface TimeData {
  timezone: string
  datetime: string
  date: string
  time: string
  dayOfWeek: string
  dayOfYear: number
  weekNumber: number
  utcOffset: string
}

export interface IPInfo {
  ip: string
  city: string
  region: string
  country: string
  latitude: number
  longitude: number
  timezone: string
  isp: string
}

export interface WikipediaSummary {
  title: string
  summary: string
  url: string
  imageUrl?: string
}

export interface DataSourceDebugInfo {
  type: "data-source-debug"
  message: string
  data: any
  timestamp: string
}

// ============= REDDIT API =============
export async function fetchReddit(subreddit: string = "all"): Promise<{
  posts: RedditPost[]
  debugInfo: DataSourceDebugInfo[]
}> {
  const debugLogs: DataSourceDebugInfo[] = []

  function addDebug(message: string, data: any = {}) {
    const debugInfo: DataSourceDebugInfo = {
      type: "data-source-debug",
      message,
      data,
      timestamp: new Date().toISOString(),
    }
    debugLogs.push(debugInfo)
    console.log("[v0] [REDDIT]", message, data)
  }

  addDebug("Reddit fetch initiated", { subreddit })

  try {
    const url = `https://www.reddit.com/r/${subreddit}/top.json?t=day&limit=10`

    addDebug("Making Reddit API request", { url, subreddit })

    const response = await fetch(url, {
      headers: {
        "User-Agent": "NoxyAI/1.0 (+https://www.noxyai.com)",
      },
    })

    addDebug("Reddit API response received", {
      status: response.status,
      ok: response.ok,
    })

    if (!response.ok) {
      const errorText = await response.text()
      addDebug("Reddit API error", { status: response.status, error: errorText.substring(0, 200) })
      throw new Error(`Reddit API error: ${response.status}`)
    }

    const data = await response.json()

    addDebug("Reddit API response parsed", {
      postCount: data.data?.children?.length || 0,
    })

    const posts: RedditPost[] = (data.data?.children || [])
      .map((item: any) => {
        const post = item.data
        return {
          title: post.title,
          subreddit: post.subreddit,
          score: post.score,
          url: `https://reddit.com${post.permalink}`,
          author: post.author,
          createdAt: new Date(post.created_utc * 1000).toISOString(),
          upvoteRatio: post.upvote_ratio,
        }
      })
      .filter((post: RedditPost) => post.title && post.author !== "[deleted]")

    addDebug("Reddit posts processed", { count: posts.length })

    return { posts, debugInfo: debugLogs }
  } catch (error) {
    addDebug("Reddit fetch error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return { posts: [], debugInfo: debugLogs }
  }
}

// ============= NEWS API =============
// Using NewsData.io free tier (no API key needed for basic usage)
export async function fetchNews(query: string): Promise<{
  articles: NewsArticle[]
  debugInfo: DataSourceDebugInfo[]
}> {
  const debugLogs: DataSourceDebugInfo[] = []

  function addDebug(message: string, data: any = {}) {
    const debugInfo: DataSourceDebugInfo = {
      type: "data-source-debug",
      message,
      data,
      timestamp: new Date().toISOString(),
    }
    debugLogs.push(debugInfo)
    console.log("[v0] [NEWS]", message, data)
  }

  addDebug("News fetch initiated", { query })

  try {
    // Using GNews API (free tier: 100 requests/day, no API key for basic usage)
    const apiKey = process.env.GNEWS_API_KEY || "demo" // Use demo key for testing
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=5&apikey=${apiKey}`

    addDebug("Making GNews API request", { url: url.replace(apiKey, "***"), query })

    const response = await fetch(url)

    addDebug("GNews API response received", {
      status: response.status,
      ok: response.ok,
    })

    if (!response.ok) {
      const errorText = await response.text()
      addDebug("GNews API error", { status: response.status, error: errorText.substring(0, 200) })
      throw new Error(`News API error: ${response.status}`)
    }

    const data = await response.json()

    addDebug("GNews API response parsed", {
      articleCount: data.articles?.length || 0,
      totalResults: data.totalArticles,
    })

    const articles: NewsArticle[] = (data.articles || []).map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      source: article.source.name,
      publishedAt: article.publishedAt,
      author: article.source.name,
    }))

    addDebug("News articles processed", { count: articles.length })

    return { articles, debugInfo: debugLogs }
  } catch (error) {
    addDebug("News fetch error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return { articles: [], debugInfo: debugLogs }
  }
}

// ============= WEATHER API =============
// Using Open-Meteo (completely free, no API key needed)
export async function fetchWeather(location: string): Promise<{
  weather: WeatherData | null
  debugInfo: DataSourceDebugInfo[]
}> {
  const debugLogs: DataSourceDebugInfo[] = []

  function addDebug(message: string, data: any = {}) {
    const debugInfo: DataSourceDebugInfo = {
      type: "data-source-debug",
      message,
      data,
      timestamp: new Date().toISOString(),
    }
    debugLogs.push(debugInfo)
    console.log("[v0] [WEATHER]", message, data)
  }

  addDebug("Weather fetch initiated", { location })

  try {
    // First, geocode the location using Open-Meteo's geocoding API
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`

    addDebug("Geocoding location", { location, url: geoUrl })

    const geoResponse = await fetch(geoUrl)
    const geoData = await geoResponse.json()

    if (!geoData.results || geoData.results.length === 0) {
      addDebug("Location not found", { location })
      return { weather: null, debugInfo: debugLogs }
    }

    const { latitude, longitude, name, country } = geoData.results[0]

    addDebug("Location geocoded", { name, country, latitude, longitude })

    // Fetch weather data using Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=kmh`

    addDebug("Fetching weather data", { url: weatherUrl })

    const weatherResponse = await fetch(weatherUrl)
    const weatherData = await weatherResponse.json()

    addDebug("Weather data received", {
      temperature: weatherData.current.temperature_2m,
      humidity: weatherData.current.relative_humidity_2m,
    })

    // Map weather codes to conditions
    const weatherCodeMap: Record<number, string> = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Depositing rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      71: "Slight snow",
      73: "Moderate snow",
      75: "Heavy snow",
      77: "Snow grains",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      85: "Slight snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunderstorm with slight hail",
      99: "Thunderstorm with heavy hail",
    }

    const weather: WeatherData = {
      location: `${name}, ${country}`,
      temperature: weatherData.current.temperature_2m,
      condition: weatherCodeMap[weatherData.current.weather_code] || "Unknown",
      humidity: weatherData.current.relative_humidity_2m,
      windSpeed: weatherData.current.wind_speed_10m,
      feelsLike: weatherData.current.apparent_temperature,
      timestamp: weatherData.current.time,
    }

    addDebug("Weather data processed", { location: weather.location, temperature: weather.temperature })

    return { weather, debugInfo: debugLogs }
  } catch (error) {
    addDebug("Weather fetch error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return { weather: null, debugInfo: debugLogs }
  }
}

// ============= CRYPTO API =============
// Using CoinGecko API (free, no API key needed)
export async function fetchCrypto(symbols: string[]): Promise<{
  prices: CryptoPrice[]
  debugInfo: DataSourceDebugInfo[]
}> {
  const debugLogs: DataSourceDebugInfo[] = []

  function addDebug(message: string, data: any = {}) {
    const debugInfo: DataSourceDebugInfo = {
      type: "data-source-debug",
      message,
      data,
      timestamp: new Date().toISOString(),
    }
    debugLogs.push(debugInfo)
    console.log("[v0] [CRYPTO]", message, data)
  }

  addDebug("Crypto fetch initiated", { symbols })

  try {
    // Map common symbols to CoinGecko IDs
    const symbolMap: Record<string, string> = {
      btc: "bitcoin",
      eth: "ethereum",
      usdt: "tether",
      bnb: "binancecoin",
      sol: "solana",
      xrp: "ripple",
      usdc: "usd-coin",
      ada: "cardano",
      doge: "dogecoin",
      trx: "tron",
    }

    const ids = symbols.map((s) => symbolMap[s.toLowerCase()] || s.toLowerCase()).join(",")

    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`

    addDebug("Making CoinGecko API request", { url, symbols, ids })

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    })

    addDebug("CoinGecko API response received", {
      status: response.status,
      ok: response.ok,
    })

    if (!response.ok) {
      const errorText = await response.text()
      addDebug("CoinGecko API error", { status: response.status, error: errorText.substring(0, 200) })
      throw new Error(`Crypto API error: ${response.status}`)
    }

    const data = await response.json()

    addDebug("CoinGecko API response parsed", {
      coinCount: data.length,
    })

    const prices: CryptoPrice[] = data.map((coin: any) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      priceChange24h: coin.price_change_24h,
      priceChangePercent24h: coin.price_change_percentage_24h,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      lastUpdated: coin.last_updated,
    }))

    addDebug("Crypto prices processed", {
      count: prices.length,
      firstPrice: prices[0]
        ? {
            symbol: prices[0].symbol,
            price: prices[0].price,
          }
        : null,
    })

    return { prices, debugInfo: debugLogs }
  } catch (error) {
    addDebug("Crypto fetch error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return { prices: [], debugInfo: debugLogs }
  }
}

// ============= CURRENCY RATE API =============
// Using ExchangeRate-API (free, no API key needed for basic usage)
export async function fetchCurrencyRate(
  from: string,
  to: string,
): Promise<{
  rate: CurrencyRate | null
  debugInfo: DataSourceDebugInfo[]
}> {
  const debugLogs: DataSourceDebugInfo[] = []

  function addDebug(message: string, data: any = {}) {
    const debugInfo: DataSourceDebugInfo = {
      type: "data-source-debug",
      message,
      data,
      timestamp: new Date().toISOString(),
    }
    debugLogs.push(debugInfo)
    console.log("[v0] [CURRENCY]", message, data)
  }

  addDebug("Currency rate fetch initiated", { from, to })

  try {
    const fromUpper = from.toUpperCase()
    const toUpper = to.toUpperCase()

    // Using ExchangeRate-API free tier
    const url = `https://api.exchangerate-api.com/v4/latest/${fromUpper}`

    addDebug("Making ExchangeRate API request", { url, from: fromUpper, to: toUpper })

    const response = await fetch(url)

    addDebug("ExchangeRate API response received", {
      status: response.status,
      ok: response.ok,
    })

    if (!response.ok) {
      const errorText = await response.text()
      addDebug("ExchangeRate API error", { status: response.status, error: errorText.substring(0, 200) })
      throw new Error(`Currency API error: ${response.status}`)
    }

    const data = await response.json()

    addDebug("ExchangeRate API response parsed", {
      base: data.base,
      ratesCount: Object.keys(data.rates || {}).length,
    })

    if (!data.rates || !data.rates[toUpper]) {
      addDebug("Target currency not found", { to: toUpper })
      return { rate: null, debugInfo: debugLogs }
    }

    const rate: CurrencyRate = {
      baseCurrency: fromUpper,
      targetCurrency: toUpper,
      rate: data.rates[toUpper],
      lastUpdated: new Date(data.time_last_updated * 1000).toISOString(),
    }

    addDebug("Currency rate processed", { from: fromUpper, to: toUpper, rate: rate.rate })

    return { rate, debugInfo: debugLogs }
  } catch (error) {
    addDebug("Currency rate fetch error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return { rate: null, debugInfo: debugLogs }
  }
}

// ============= TIME & DATE API =============
// Using WorldTimeAPI (free, no API key needed)
export async function fetchTime(timezone?: string): Promise<{
  time: TimeData | null
  debugInfo: DataSourceDebugInfo[]
}> {
  const debugLogs: DataSourceDebugInfo[] = []

  function addDebug(message: string, data: any = {}) {
    const debugInfo: DataSourceDebugInfo = {
      type: "data-source-debug",
      message,
      data,
      timestamp: new Date().toISOString(),
    }
    debugLogs.push(debugInfo)
    console.log("[v0] [TIME]", message, data)
  }

  addDebug("Time fetch initiated", { timezone })

  try {
    // Using WorldTimeAPI
    const url = timezone
      ? `https://worldtimeapi.org/api/timezone/${encodeURIComponent(timezone)}`
      : "https://worldtimeapi.org/api/ip"

    addDebug("Making WorldTimeAPI request", { url, timezone })

    const response = await fetch(url)

    addDebug("WorldTimeAPI response received", {
      status: response.status,
      ok: response.ok,
    })

    if (!response.ok) {
      const errorText = await response.text()
      addDebug("WorldTimeAPI error", { status: response.status, error: errorText.substring(0, 200) })
      throw new Error(`Time API error: ${response.status}`)
    }

    const data = await response.json()

    addDebug("WorldTimeAPI response parsed", {
      timezone: data.timezone,
      datetime: data.datetime,
    })

    const datetime = new Date(data.datetime)
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    const time: TimeData = {
      timezone: data.timezone,
      datetime: data.datetime,
      date: datetime.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      time: datetime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      dayOfWeek: daysOfWeek[datetime.getDay()],
      dayOfYear: data.day_of_year,
      weekNumber: data.week_number,
      utcOffset: data.utc_offset,
    }

    addDebug("Time data processed", { timezone: time.timezone, time: time.time })

    return { time, debugInfo: debugLogs }
  } catch (error) {
    addDebug("Time fetch error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return { time: null, debugInfo: debugLogs }
  }
}

// ============= IP INFORMATION API =============
// Using ipapi.co (free, no API key needed)
export async function fetchIPInfo(): Promise<{
  info: IPInfo | null
  debugInfo: DataSourceDebugInfo[]
}> {
  const debugLogs: DataSourceDebugInfo[] = []

  function addDebug(message: string, data: any = {}) {
    const debugInfo: DataSourceDebugInfo = {
      type: "data-source-debug",
      message,
      data,
      timestamp: new Date().toISOString(),
    }
    debugLogs.push(debugInfo)
    console.log("[v0] [IP_INFO]", message, data)
  }

  addDebug("IP info fetch initiated", {})

  try {
    const url = "https://ipapi.co/json/"

    addDebug("Making IP API request", { url })

    const response = await fetch(url)

    addDebug("IP API response received", {
      status: response.status,
      ok: response.ok,
    })

    if (!response.ok) {
      const errorText = await response.text()
      addDebug("IP API error", { status: response.status, error: errorText.substring(0, 200) })
      throw new Error(`IP API error: ${response.status}`)
    }

    const data = await response.json()

    addDebug("IP API response parsed", {
      ip: data.ip,
      city: data.city,
      country: data.country_name,
    })

    const info: IPInfo = {
      ip: data.ip,
      city: data.city,
      region: data.region,
      country: data.country_name,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      isp: data.org,
    }

    addDebug("IP info processed", {
      city: info.city,
      country: info.country,
      timezone: info.timezone,
    })

    return { info, debugInfo: debugLogs }
  } catch (error) {
    addDebug("IP info fetch error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return { info: null, debugInfo: debugLogs }
  }
}

// ============= WIKIPEDIA SUMMARY API =============
// Using Wikipedia API (free, no API key needed)
export async function fetchWikipediaSummary(topic: string): Promise<{
  summary: WikipediaSummary | null
  debugInfo: DataSourceDebugInfo[]
}> {
  const debugLogs: DataSourceDebugInfo[] = []

  function addDebug(message: string, data: any = {}) {
    const debugInfo: DataSourceDebugInfo = {
      type: "data-source-debug",
      message,
      data,
      timestamp: new Date().toISOString(),
    }
    debugLogs.push(debugInfo)
    console.log("[v0] [WIKIPEDIA]", message, data)
  }

  addDebug("Wikipedia summary fetch initiated", { topic })

  try {
    const encodedTopic = encodeURIComponent(topic)
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTopic}`

    addDebug("Making Wikipedia API request", { url, topic })

    const response = await fetch(url)

    addDebug("Wikipedia API response received", {
      status: response.status,
      ok: response.ok,
    })

    if (!response.ok) {
      if (response.status === 404) {
        addDebug("Wikipedia page not found", { topic })
        return { summary: null, debugInfo: debugLogs }
      }
      const errorText = await response.text()
      addDebug("Wikipedia API error", { status: response.status, error: errorText.substring(0, 200) })
      throw new Error(`Wikipedia API error: ${response.status}`)
    }

    const data = await response.json()

    addDebug("Wikipedia API response parsed", {
      title: data.title,
      summaryLength: data.extract?.length,
    })

    const summary: WikipediaSummary = {
      title: data.title,
      summary: data.extract || data.description || "",
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodedTopic}`,
      imageUrl: data.thumbnail?.source,
    }

    addDebug("Wikipedia summary processed", {
      title: summary.title,
      summaryLength: summary.summary.length,
    })

    return { summary, debugInfo: debugLogs }
  } catch (error) {
    addDebug("Wikipedia summary fetch error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return { summary: null, debugInfo: debugLogs }
  }
}

// ============= DETECTION FUNCTIONS =============

export function shouldFetchReddit(message: string): boolean {
  const msg = message.toLowerCase()
  return /\b(reddit|trending|viral|discussion|community|subreddit|r\/|upvote|redditor)\b/i.test(msg)
}

export function shouldFetchNews(message: string): boolean {
  const msg = message.toLowerCase()
  return /\b(news|headlines|breaking|latest|current|today|recent|update|report|story|article)\b/i.test(msg)
}

export function shouldFetchWeather(message: string): boolean {
  const msg = message.toLowerCase()
  return /\b(weather|temperature|forecast|climate|hot|cold|rain|snow|sunny|cloudy|wind|humidity|condition|outside|outside weather)\b/i.test(
    msg,
  )
}

export function shouldFetchCrypto(message: string): boolean {
  const msg = message.toLowerCase()
  return /\b(bitcoin|btc|ethereum|eth|crypto|cryptocurrency|price|coin|token|blockchain|digital currency|market|trading)\b/i.test(
    msg,
  )
}

export function shouldFetchCurrency(message: string): boolean {
  const msg = message.toLowerCase()
  return (
    /\b(currency|exchange|convert|conversion|forex|usd|eur|gbp|jpy|cad|aud|chf|cny|inr|rate|price)\b/i.test(msg) &&
    !/\b(no|not|don't|doesn't)\b/i.test(msg)
  )
}

export function shouldFetchTime(message: string): boolean {
  const msg = message.toLowerCase()
  return /\b(time|date|clock|timezone|what time|current time|now|today|hour|minute|second|when)\b/i.test(msg)
}

export function shouldFetchIPInfo(message: string): boolean {
  const msg = message.toLowerCase()
  return /\b(my ip|my location|where am i|my country|my city|my region|ip address|geolocation|area info)\b/i.test(msg)
}

export function shouldFetchWikipedia(message: string): boolean {
  const msg = message.toLowerCase()
  return /\b(tell me about|what is|define|explain|summary of|about|information about|learn about|background on)\b/i.test(msg) && msg.length > 10
}

export function extractNewsQuery(message: string): string {
  // Remove common phrases to get the core query
  let query = message
    .replace(/\b(latest|recent|current|today's|breaking)\s+(news|headlines)\s+(about|on|for)?\s*/i, "")
    .replace(/\b(what's|whats|show me|tell me|get|find)\s+(the\s+)?(news|headlines)\s+(about|on|for)?\s*/i, "")
    .trim()

  if (query.length < 3) {
    query = "top headlines"
  }

  return query
}

export function extractLocation(message: string): string {
  // Try to extract location from message
  const patterns = [
    /weather\s+in\s+([a-z\s,]+)/i,
    /weather\s+for\s+([a-z\s,]+)/i,
    /weather\s+at\s+([a-z\s,]+)/i,
    /([a-z\s,]+)\s+weather/i,
    /temperature\s+in\s+([a-z\s,]+)/i,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return "New York" // Default location
}

export function extractCryptoSymbols(message: string): string[] {
  const msg = message.toLowerCase()
  const symbols: string[] = []

  // Common crypto symbols
  const cryptoMap: Record<string, string> = {
    bitcoin: "btc",
    ethereum: "eth",
    tether: "usdt",
    binance: "bnb",
    solana: "sol",
    ripple: "xrp",
    cardano: "ada",
    dogecoin: "doge",
    tron: "trx",
  }

  // Check for explicit symbols
  for (const [name, symbol] of Object.entries(cryptoMap)) {
    if (msg.includes(name) || msg.includes(symbol)) {
      symbols.push(symbol)
    }
  }

  // If no specific crypto mentioned, default to BTC
  if (symbols.length === 0) {
    symbols.push("btc")
  }

  return symbols
}

export function extractCurrencyPair(message: string): { from: string; to: string } {
  const msg = message.toLowerCase()

  // Common currency codes
  const currencies = ["usd", "eur", "gbp", "jpy", "cad", "aud", "chf", "cny", "inr", "krw", "mxn", "brl", "zar"]

  // Try to find "X to Y" or "X in Y" patterns
  const patterns = [
    /(\w{3})\s+to\s+(\w{3})/i,
    /(\w{3})\s+in\s+(\w{3})/i,
    /convert\s+(\w{3})\s+to\s+(\w{3})/i,
    /(\w{3})\s+into\s+(\w{3})/i,
  ]

  for (const pattern of patterns) {
    const match = msg.match(pattern)
    if (match && match[1] && match[2]) {
      const from = match[1].toUpperCase()
      const to = match[2].toUpperCase()
      if (currencies.includes(from.toLowerCase()) && currencies.includes(to.toLowerCase())) {
        return { from, to }
      }
    }
  }

  // Default to USD to EUR
  return { from: "USD", to: "EUR" }
}

export function extractTimezone(message: string): string | undefined {
  const msg = message.toLowerCase()

  // Common timezone patterns
  const timezonePatterns = [
    /time\s+in\s+([a-z_/]+)/i,
    /time\s+at\s+([a-z_/]+)/i,
    /([a-z_/]+)\s+time/i,
    /timezone\s+([a-z_/]+)/i,
  ]

  for (const pattern of timezonePatterns) {
    const match = msg.match(pattern)
    if (match && match[1]) {
      // Convert city names to timezone format
      const location = match[1].trim().replace(/\s+/g, "_")
      return location
    }
  }

  return undefined
}

export function extractWikipediaTopic(message: string): string | undefined {
  const msg = message.toLowerCase()

  // Try to extract topic from common patterns
  const patterns = [
    /(?:tell me about|what is|define|explain|summary of|about|information about|learn about|background on)\s+(.+?)(?:\?|$)/i,
    /(?:who is|who was)\s+(.+?)(?:\?|$)/i,
    /(?:what are|what were)\s+(.+?)(?:\?|$)/i,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      const topic = match[1].trim().replace(/[?.!,;:]/g, "")
      if (topic.length >= 2) {
        return topic
      }
    }
  }

  return undefined
}

export function extractRedditSubreddit(message: string): string {
  const msg = message.toLowerCase()
  
  // Try to extract subreddit name
  const subredditMatch = message.match(/r\/(\w+)/i)
  if (subredditMatch) {
    return subredditMatch[1]
  }

  // Check for specific subreddit keywords
  const keywordMap: Record<string, string> = {
    "programming": "programming",
    "technology": "technology",
    "science": "science",
    "business": "business",
    "news": "news",
    "entertainment": "entertainment",
    "gaming": "gaming",
    "sports": "sports",
  }

  for (const [keyword, subreddit] of Object.entries(keywordMap)) {
    if (msg.includes(keyword)) {
      return subreddit
    }
  }

  return "all" // Default subreddit
}
