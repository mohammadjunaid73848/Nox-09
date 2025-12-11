"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"

type Memory = { id: string; key: string; value: string; category: string; created_at: string }

export function MemoryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const supabase = createClient()
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("user_memories").select("*").order("created_at", { ascending: false })
    if (!error) setMemories(data as any)
    setLoading(false)
  }

  useEffect(() => {
    if (open) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const del = async (id: string) => {
    const prev = memories
    setMemories((m) => m.filter((x) => x.id !== id))
    const { error } = await supabase.from("user_memories").delete().eq("id", id)
    if (error) setMemories(prev) // revert on failure
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Your Memory</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[50vh] overflow-auto">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : memories.length === 0 ? (
            <div className="text-sm text-muted-foreground">No memory saved yet.</div>
          ) : (
            memories.map((m) => (
              <div key={m.id} className="flex items-start justify-between border rounded-lg p-3">
                <div className="text-sm">
                  <div className="font-medium">{m.key}</div>
                  <div className="text-muted-foreground">{m.value}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => del(m.id)} aria-label="Delete memory">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
