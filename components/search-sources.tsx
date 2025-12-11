"use client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ExternalLink, Video } from "lucide-react"

interface SearchSource {
  title: string
  link: string
  snippet: string
  displayLink: string
  image?: string
  video?: string
}

interface SearchSourcesProps {
  sources: SearchSource[]
}

export function SearchSources({ sources }: SearchSourcesProps) {
  if (!sources || sources.length === 0) {
    return null
  }

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto">
            Sources ({sources.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Search Sources</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {sources.map((source, index) => (
              <div key={index} className="group">
                <a
                  href={source.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {source.image && (
                        <div className="mb-3">
                          <img
                            src={source.image || "/placeholder.svg"}
                            alt={source.title}
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                            }}
                          />
                        </div>
                      )}
                      {source.video && (
                        <div className="mb-2 flex items-center gap-2 text-xs text-primary">
                          <Video className="w-4 h-4" />
                          <span>Video content available</span>
                        </div>
                      )}
                      <h5 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {source.title}
                      </h5>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{source.snippet}</p>
                      <p className="text-xs text-muted-foreground/70 mt-2 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {source.displayLink}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
