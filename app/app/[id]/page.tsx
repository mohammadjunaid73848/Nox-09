import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

export default async function AppPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: app, error } = await supabase.from("generated_apps").select("*").eq("id", params.id).single()

  if (error || !app) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{app.name}</h1>
          <p className="text-muted-foreground">{app.description}</p>
        </div>

        {/* App Preview */}
        <div className="bg-card border border-border rounded-lg p-8 min-h-[60vh]">
          <div className="text-center text-muted-foreground">
            <p className="mb-4">App Preview</p>
            <p className="text-sm">This is a generated app. The actual app content would be rendered here.</p>
            <div className="mt-8 p-6 bg-muted rounded-lg">
              <pre className="text-left text-xs overflow-auto max-h-96">
                <code>{JSON.stringify(app.code, null, 2)}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Dependencies</h3>
            <div className="space-y-2">
              {app.dependencies?.map((dep: string) => (
                <div key={dep} className="text-sm text-muted-foreground">
                  • {dep}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Setup Instructions</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{app.instructions}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
