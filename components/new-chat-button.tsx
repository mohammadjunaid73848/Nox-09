"use client"

export function NewChatButton({ onNew }: { onNew: () => void }) {
  return (
    <button
      className="px-3 py-1 rounded border text-sm"
      onClick={onNew}
      aria-label="Start new chat"
      title="Start a new chat"
    >
      New chat
    </button>
  )
}
