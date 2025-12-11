export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  reasoning?: string
  createdAt: Date
  sources?: Array<{
    title: string
    url: string
  }>
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}
