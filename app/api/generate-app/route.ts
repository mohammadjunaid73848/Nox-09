import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { prompt, userId } = await request.json()

    const supabase = await createClient()

    // Generate app code using AI
    const { text: appCode } = await generateText({
      model: "openai/gpt-4-turbo",
      prompt: `Create a complete, production-ready Next.js app based on this request: "${prompt}"

IMPORTANT GUIDELINES FOR CODE GENERATION:
1. NEVER add external CDN links (font-awesome, cdn.tailwindcss.com, etc)
2. FONTS: Use Next.js built-in font optimization:
   - Import from 'next/font/google' for Google Fonts (Geist, Inter, etc)
   - Configure in layout.tsx with font.variable
   - Apply with className like "font-sans" or "font-mono"
3. ICONS: Use 'lucide-react' package for all icons (no Font Awesome CDN)
4. STYLING: Tailwind CSS is pre-installed and configured:
   - Use Tailwind classes for all styling
   - No need to import or add Tailwind via CDN
5. STRUCTURE:
   - app/page.tsx - main page
   - app/layout.tsx - root layout with fonts
   - components/ - reusable React components
   - lib/ - utility functions
   - app/api/ - backend routes if needed
6. DEPENDENCIES: Only include: "react", "next", "lucide-react" (add others only if essential)

Return ONLY valid JSON with this structure:
{
  "name": "App Name",
  "description": "Brief description",
  "files": {
    "app/page.tsx": "React component code",
    "app/layout.tsx": "Layout code with Next.js fonts imported from 'next/font/google'",
    "components/...": "Other components",
    "lib/...": "Utilities",
    "app/api/...": "API routes if needed"
  },
  "dependencies": ["next", "react", "lucide-react"],
  "instructions": "Setup instructions"
}`,
    })

    // Parse the generated code
    const appData = JSON.parse(appCode)

    // Save to database
    const { data, error } = await supabase
      .from("generated_apps")
      .insert({
        user_id: userId,
        name: appData.name,
        description: appData.description,
        code: appData.files,
        dependencies: appData.dependencies,
        instructions: appData.instructions,
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({
      success: true,
      appId: data.id,
      app: data,
    })
  } catch (error) {
    console.error("[v0] App generation error:", error)
    return Response.json({ error: "Failed to generate app" }, { status: 500 })
  }
}
