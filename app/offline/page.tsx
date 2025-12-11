"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { WifiOff, RotateCcw } from "lucide-react"

type Player = "X" | "O" | null
type Board = Player[]

export default function OfflinePage() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null))
  const [isXNext, setIsXNext] = useState(true)
  const [winner, setWinner] = useState<Player>(null)
  const [winningLine, setWinningLine] = useState<number[]>([])
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const calculateWinner = (squares: Board): { winner: Player; line: number[] } => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ]

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] }
      }
    }

    return { winner: null, line: [] }
  }

  const handleClick = (index: number) => {
    if (board[index] || winner) return

    const newBoard = [...board]
    newBoard[index] = isXNext ? "X" : "O"
    setBoard(newBoard)

    const { winner: newWinner, line } = calculateWinner(newBoard)
    if (newWinner) {
      setWinner(newWinner)
      setWinningLine(line)
    } else {
      setIsXNext(!isXNext)
    }
  }

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setIsXNext(true)
    setWinner(null)
    setWinningLine([])
  }

  const isBoardFull = board.every((cell) => cell !== null)

  if (isOnline) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">You're back online!</h1>
          <Button onClick={() => (window.location.href = "/")} size="lg" className="rounded-full">
            Return to Chat
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <WifiOff className="w-5 h-5" />
            <span className="text-sm">You're offline</span>
          </div>
          <h1 className="text-2xl font-bold">Play Tic-Tac-Toe</h1>
          <p className="text-sm text-muted-foreground">While you wait to reconnect</p>
        </div>

        <div className="bg-card rounded-2xl p-6 space-y-4 border border-border">
          <div className="text-center">
            {winner ? (
              <p className="text-lg font-semibold text-primary">Player {winner} wins! 🎉</p>
            ) : isBoardFull ? (
              <p className="text-lg font-semibold text-muted-foreground">It's a draw!</p>
            ) : (
              <p className="text-lg font-semibold">Player {isXNext ? "X" : "O"}'s turn</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 aspect-square">
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => handleClick(index)}
                disabled={!!cell || !!winner}
                className={`
                  aspect-square rounded-xl border-2 text-4xl font-bold transition-all
                  ${winningLine.includes(index) ? "bg-primary/20 border-primary" : "bg-muted border-border"}
                  ${!cell && !winner ? "hover:bg-muted/80 active:scale-95" : ""}
                  ${cell === "X" ? "text-blue-500" : cell === "O" ? "text-red-500" : ""}
                  disabled:cursor-not-allowed
                `}
              >
                {cell}
              </button>
            ))}
          </div>

          <Button onClick={resetGame} variant="outline" className="w-full rounded-full bg-transparent" size="lg">
            <RotateCcw className="w-4 h-4 mr-2" />
            New Game
          </Button>
        </div>

        <div className="text-center">
          <Button onClick={() => window.location.reload()} variant="ghost" size="sm" className="rounded-full">
            Check Connection
          </Button>
        </div>
      </div>
    </div>
  )
}
