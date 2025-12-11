type TimeQueryMatch = {
  tz: string
  locationLabel: string
}

/**
 * Detect if a user message is a time query and return a timezone + label if recognized.
 * Currently focuses on Delhi/India, but includes a small map for common cities.
 */
export function isTimeQuery(userMessage: string): TimeQueryMatch | null {
  if (!userMessage) return null
  const msg = userMessage.toLowerCase()

  // Quick exits for obvious time queries
  const mentionsTime = /\b(current )?(time|clock)\b/.test(msg) || /\bwhat time\b/.test(msg) || /\btime now\b/.test(msg)

  // Common mappings (extend as needed)
  const cityMap: Record<string, { tz: string; label: string; aliases: RegExp[] }> = {
    delhi: {
      tz: "Asia/Kolkata",
      label: "Delhi",
      aliases: [/new delhi/, /\bindia\b/, /\bkolkata\b/, /\bist\b/],
    },
    mumbai: { tz: "Asia/Kolkata", label: "Mumbai", aliases: [] },
    london: { tz: "Europe/London", label: "London", aliases: [] },
    "new york": { tz: "America/New_York", label: "New York", aliases: [/nyc/, /newyork/] },
    "los angeles": { tz: "America/Los_Angeles", label: "Los Angeles", aliases: [/la\b/] },
    tokyo: { tz: "Asia/Tokyo", label: "Tokyo", aliases: [] },
    sydney: { tz: "Australia/Sydney", label: "Sydney", aliases: [] },
  }

  // If message clearly about time, try to identify city
  if (mentionsTime) {
    // Direct Delhi/India checks (priority)
    if (/(delhi|new delhi|india|kolkata|ist)\b/.test(msg)) {
      return { tz: "Asia/Kolkata", locationLabel: "Delhi" }
    }

    // Generic "time in <place>" extraction
    const inMatch = msg.match(/\btime\s*(in|at|of|for)?\s*([a-z ,.'-]+)$/i)
    const candidateRaw = inMatch?.[2]?.trim() || ""

    // Try to match a city in map
    const candidates = Object.entries(cityMap)
    for (const [key, { tz, label, aliases }] of candidates) {
      if (
        candidateRaw.includes(key) ||
        aliases.some((re) => re.test(msg)) ||
        // whole-message match fallback
        msg.includes(key)
      ) {
        return { tz, locationLabel: label }
      }
    }

    // If it's a time query without a known place, we won't claim a local time
    return null
  }

  // Phrasings like "Delhi time" or "Kolkata time"
  if (/\b(delhi|new delhi|india|kolkata)\s+time\b/.test(msg)) {
    return { tz: "Asia/Kolkata", locationLabel: "Delhi" }
  }

  return null
}

/**
 * Format the current time in a given IANA timezone using the server clock.
 */
export function formatNowInTZ(tz: string): string {
  const now = new Date()
  // Example: "03:12 PM, Tuesday, October 14, 2025 (GMT+5:30)"
  const time = new Intl.DateTimeFormat("en-IN", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(now)

  const weekday = new Intl.DateTimeFormat("en-IN", {
    timeZone: tz,
    weekday: "long",
  }).format(now)

  const date = new Intl.DateTimeFormat("en-IN", {
    timeZone: tz,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now)

  // Use short name (often GMT offset); IST may render as GMT+5:30
  const tzShort = new Intl.DateTimeFormat("en-IN", {
    timeZone: tz,
    timeZoneName: "short",
    hour: "2-digit",
  })
    .formatToParts(now)
    .find((p) => p.type === "timeZoneName")?.value

  return `${time}, ${weekday}, ${date}${tzShort ? ` (${tzShort})` : ""}`
}

/**
 * Build a human answer for a time query using the server clock.
 */
export function getTimeAnswer(userMessage: string): string | null {
  const match = isTimeQuery(userMessage)
  if (!match) return null

  const current = formatNowInTZ(match.tz)
  return `The current time in ${match.locationLabel} is ${current}.`
}
