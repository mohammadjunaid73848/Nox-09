export async function fetchWeather(city: string) {
  try {
    const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
    if (!response.ok) throw new Error("Weather API failed")
    return await response.json()
  } catch (error) {
    console.error("[v0] Weather fetch error:", error)
    return null
  }
}

export async function fetchCurrentTime(timezone: string = "Asia/Kolkata") {
  try {
    const response = await fetch(`https://worldtimeapi.org/api/timezone/${timezone}`)
    if (!response.ok) throw new Error("Time API failed")
    return await response.json()
  } catch (error) {
    console.error("[v0] Time fetch error:", error)
    return null
  }
}

export async function fetchCryptoPrices() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,dogecoin&vs_currencies=usd,inr"
    )
    if (!response.ok) throw new Error("Crypto API failed")
    return await response.json()
  } catch (error) {
    console.error("[v0] Crypto fetch error:", error)
    return null
  }
}

export async function fetchLocationInfo() {
  try {
    const response = await fetch("https://ipapi.co/json/")
    if (!response.ok) throw new Error("Location API failed")
    return await response.json()
  } catch (error) {
    console.error("[v0] Location fetch error:", error)
    return null
  }
}

export async function fetchRedditNews() {
  try {
    const response = await fetch("https://www.reddit.com/r/worldnews/.json", {
      headers: { "User-Agent": "NoxyAI/1.0" },
    })
    if (!response.ok) throw new Error("Reddit API failed")
    const data = await response.json()
    return data.data.children.slice(0, 10).map((post: any) => ({
      title: post.data.title,
      url: post.data.url,
      score: post.data.score,
      created_utc: post.data.created_utc,
    }))
  } catch (error) {
    console.error("[v0] Reddit fetch error:", error)
    return null
  }
}

export async function fetchWikipediaSummary(topic: string) {
  try {
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`)
    if (!response.ok) throw new Error("Wikipedia API failed")
    return await response.json()
  } catch (error) {
    console.error("[v0] Wikipedia fetch error:", error)
    return null
  }
}

export async function gatherRealTimeData(userQuery: string) {
  const results: Record<string, any> = {}
  const query = userQuery.toLowerCase()

  if (query.includes("weather") || query.includes("climate")) {
    results.weather = await fetchWeather("London")
  }

  if (query.includes("time") || query.includes("date") || query.includes("current")) {
    results.time = await fetchCurrentTime()
  }

  if (query.includes("crypto") || query.includes("bitcoin") || query.includes("ethereum")) {
    results.crypto = await fetchCryptoPrices()
  }

  if (query.includes("location") || query.includes("where") || query.includes("geolocation")) {
    results.location = await fetchLocationInfo()
  }

  if (query.includes("news") || query.includes("current events")) {
    results.news = await fetchRedditNews()
  }

  if (query.includes("wikipedia") || query.includes("summary") || query.includes("about")) {
    // Extract topic from query
    const topic = query.split("about")[1]?.trim() || query.split("wikipedia")[1]?.trim() || "technology"
    results.wikipedia = await fetchWikipediaSummary(topic)
  }

  return results
}
