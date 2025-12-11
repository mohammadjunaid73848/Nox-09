# noxyai.com 

A modern AI chat application with intelligent web search capabilities.
## Features

- 🤖 **Together AI Integration**: Uses free Llama 3.3 70B and other powerful models
- 🔍 **Intelligent Web Search**: Automatically detects when to search the web and returns structured JSON data
- 📰 **Live Data Sources**: News, weather, and cryptocurrency data integration
- 📎 **File Attachments**: Support for images and PDFs
- 💬 **Chat History**: Persistent conversations with Supabase
- 🎨 **Modern UI**: Clean, responsive design with dark mode support

## Environment Variables

You need to add the following environment variable to your project:

### Required
- `TOGETHER_API_KEY` - Your Together AI API key (get it free at https://api.together.xyz)

### Optional (for enhanced features)
- `GOOGLE_CSE_API_KEY` - Google Custom Search API key for web search
- `GOOGLE_CSE_CX` - Google Custom Search Engine ID
- `GNEWS_API_KEY` - GNews API key for news articles

### Already Configured
- Supabase credentials (for chat history)
- Other data source APIs

## How It Works

### Web Search Intelligence

The AI automatically detects when you need current information and performs web search:

- **Triggers**: "latest", "recent", "current", "today", "news", "weather", "stock price", etc.
- **Returns**: Structured JSON data with titles, URLs, snippets, and relevance scores
- **Smart**: Adds current year context (2025) to ensure fresh results

### Together AI Models

Choose from multiple free and premium models:

- **Llama 3.3 70B Turbo (Free)** - Default, fast and powerful
- **Llama 3.1 8B Turbo (Free)** - Lightweight for quick responses
- **Llama 3.1 70B/405B** - Premium models for complex tasks
- **Qwen 2.5 72B** - Excellent reasoning capabilities
- **DeepSeek V3** - Advanced coding assistance

## Getting Started

1. Clone the repository
2. Add `TOGETHER_API_KEY` to your environment variables in Project Settings
3. Deploy or run locally with `npm run dev`
4. Start chatting!

## Usage Examples

- "Latest news about AI" - Triggers web search with current year context
- "Weather in New York today" - Fetches live weather data
- "Stock price of AAPL" - Gets real-time cryptocurrency/stock data
- "Explain quantum computing" - Uses AI knowledge without search
- "Compare iPhone 15 vs 16" - Searches web for comparison data

## Debug Panel

Click the orange bug icon to see:
- Web search queries and results
- Data source API calls
- AI model responses
- Error messages and diagnostics

## Architecture

- **Frontend**: Next.js 15 with React 19
- **AI**: Together AI API with streaming responses
- **Database**: Supabase for chat history
- **Search**: Google Custom Search API
- **Styling**: Tailwind CSS v4 with shadcn/ui components

## License

MIT
