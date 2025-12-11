// This prevents text grabbing issues caused by high temperature while maintaining response quality

export function analyzePromptForTemperature(userMessage: string): number {
  const messageLower = userMessage.toLowerCase()

  // Factual queries: need lower temperature (0.3-0.5) for accuracy
  const factualKeywords = [
    "fact",
    "define",
    "explain",
    "what is",
    "who is",
    "when did",
    "where is",
    "how does",
    "calculate",
    "list",
    "summarize",
    "research",
    "find",
    "accuracy",
    "precise",
    "correct",
  ]
  const isFactual = factualKeywords.some((keyword) => messageLower.includes(keyword))
  if (isFactual) return 0.3

  // Code/Technical: need moderate temperature (0.4-0.7) for precision
  const codeKeywords = [
    "code",
    "function",
    "debug",
    "error",
    "fix",
    "implement",
    "api",
    "database",
    "query",
    "algorithm",
    "optimize",
    "refactor",
    "syntax",
    "type",
    "interface",
  ]
  const isCode = codeKeywords.some((keyword) => messageLower.includes(keyword))
  if (isCode) return 0.5

  // Analysis/Professional: need balanced temperature (0.6-0.8)
  const analysisKeywords = [
    "analyze",
    "compare",
    "evaluate",
    "assess",
    "report",
    "business",
    "strategy",
    "plan",
    "proposal",
    "audit",
    "review",
  ]
  const isAnalysis = analysisKeywords.some((keyword) => messageLower.includes(keyword))
  if (isAnalysis) return 0.7

  // Creative: higher temperature (0.8-1.2) for variety
  const creativeKeywords = [
    "create",
    "write",
    "story",
    "poem",
    "brainstorm",
    "idea",
    "imagine",
    "design",
    "invent",
    "compose",
    "generate",
    "fiction",
    "creative",
  ]
  const isCreative = creativeKeywords.some((keyword) => messageLower.includes(keyword))
  if (isCreative) return 1.0

  // Default balanced temperature
  return 0.8
}
