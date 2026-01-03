import type React from "react"
// Famous religious, historical, and cultural personalities
export const FAMOUS_PERSONALITIES = {
  prophet_muhammad: {
    names: ["Prophet Muhammad", "Muhammad", "Mohammad", "Mohammed", "صلی اللہ علیہ وسلم"],
    honorific: "صلی اللہ علیہ وسلم",
    description: "Prophet of Islam",
    importance: "Most revered figure in Islam",
  },
  jesus_christ: {
    names: ["Jesus", "Jesus Christ", "Christ"],
    honorific: "Peace be upon him",
    description: "Central figure of Christianity",
    importance: "Most revered figure in Christianity",
  },
  moses: {
    names: ["Moses", "Musa"],
    honorific: "Peace be upon him",
    description: "Prophet in Judaism, Christianity, Islam",
    importance: "Founder of Judaism",
  },
  buddha: {
    names: ["Buddha", "Siddhartha", "Gautama Buddha"],
    honorific: "Blessed one",
    description: "Founder of Buddhism",
    importance: "Most revered figure in Buddhism",
  },
  gandhi: {
    names: ["Gandhi", "Mahatma Gandhi"],
    honorific: "Mahatma",
    description: "Leader of Indian independence",
    importance: "Spiritual and political leader",
  },
  ali: {
    names: ["Ali", "Imam Ali"],
    honorific: "Alayhi assalam",
    description: "Fourth Caliph of Islam",
    importance: "Important figure in Islam",
  },
  fatima: {
    names: ["Fatima", "Fatimah"],
    honorific: "Radi Allahu Anha",
    description: "Daughter of Prophet Muhammad",
    importance: "Revered in Islam",
  },
  hussain: {
    names: ["Hussain", "Husain"],
    honorific: "Alayhi assalam",
    description: "Grandson of Prophet Muhammad",
    importance: "Revered martyr in Islam",
  },
}

export function detectPersonality(text: string): string | null {
  const lowerText = text.toLowerCase()

  for (const [key, personality] of Object.entries(FAMOUS_PERSONALITIES)) {
    for (const name of personality.names) {
      if (lowerText.includes(name.toLowerCase())) {
        return key
      }
    }
  }

  return null
}

export function highlightPersonalities(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0

  const allNames = Object.values(FAMOUS_PERSONALITIES).flatMap((p) => p.names)
  const sortedNames = allNames.sort((a, b) => b.length - a.length) // Sort by length to match longer names first

  const regex = new RegExp(`(${sortedNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi")

  const matches = Array.from(text.matchAll(regex))

  matches.forEach((match) => {
    const start = match.index!
    const end = start + match[0].length

    // Add text before match
    if (start > lastIndex) {
      nodes.push(text.substring(lastIndex, start))
    }

    // Find which personality this is
    const matchedName = match[0]
    const personalityKey = Object.entries(FAMOUS_PERSONALITIES).find((entry) =>
      entry[1].names.some((n) => n.toLowerCase() === matchedName.toLowerCase()),
    )?.[0]

    if (personalityKey) {
      const personality = FAMOUS_PERSONALITIES[personalityKey as keyof typeof FAMOUS_PERSONALITIES]
      nodes.push(
        <span
          key={`${start}-${end}`}
          className="bg-yellow-200/40 dark:bg-yellow-900/30 px-1 py-0.5 rounded font-semibold text-amber-900 dark:text-amber-200 border-b-2 border-amber-400/50 cursor-help"
          title={`${personality.description} - ${personality.importance}`}
        >
          {matchedName}
          {personality.honorific && <span className="text-xs ml-0.5 opacity-75">({personality.honorific})</span>}
        </span>,
      )
    }

    lastIndex = end
  })

  // Add remaining text
  if (lastIndex < text.length) {
    nodes.push(text.substring(lastIndex))
  }

  return nodes
}
