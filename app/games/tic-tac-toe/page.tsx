"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type CellValue = "X" | "O" | null

export default function TicTacToe() {
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null))
  const [isXNext, setIsXNext] = useState(true)
  const [gameHistory, setGameHistory] = useState<{ winner: string | null; xScore: number; oScore: number }[]>([
    { winner: null, xScore: 0, oScore: 0 },
  ])

  const calculateWinner = (squares: CellValue[]): CellValue => {
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
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i]
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a]
      }
    }
    return null
  }

  const winner = calculateWinner(board)
  const isBoardFull = board.every((cell) => cell !== null)

  const handleClick = (index: number) => {
    if (board[index] || winner) return

    const newBoard = [...board]
    newBoard[index] = isXNext ? "X" : "O"
    setBoard(newBoard)
    setIsXNext(!isXNext)

    const gameWinner = calculateWinner(newBoard)
    if (gameWinner || isBoardFull) {
      const history = gameHistory[gameHistory.length - 1]
      setGameHistory([
        ...gameHistory,
        {
          winner: gameWinner,
          xScore: gameWinner === "X" ? history.xScore + 1 : history.xScore,
          oScore: gameWinner === "O" ? history.oScore + 1 : history.oScore,
        },
      ])
    }
  }

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setIsXNext(true)
  }

  const resetScores = () => {
    setBoard(Array(9).fill(null))
    setIsXNext(true)
    setGameHistory([{ winner: null, xScore: 0, oScore: 0 }])
  }

  const currentScore = gameHistory[gameHistory.length - 1]

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Tic Tac Toe</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Score: X: <span className="font-bold">{currentScore.xScore}</span> | O:{" "}
              <span className="font-bold">{currentScore.oScore}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-4">
              {winner ? (
                <p className="text-lg font-bold text-green-600">🎉 Player {winner} Wins!</p>
              ) : isBoardFull ? (
                <p className="text-lg font-bold text-amber-600">🤝 It's a Draw!</p>
              ) : (
                <p className="text-lg font-semibold">Current Player: {isXNext ? "X" : "O"}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {board.map((cell, index) => (
                <button
                  key={index}
                  onClick={() => handleClick(index)}
                  className="w-20 h-20 bg-slate-100 border-2 border-slate-300 rounded-lg text-2xl font-bold hover:bg-slate-200 transition-colors disabled:cursor-not-allowed"
                  disabled={!!winner || isBoardFull}
                >
                  {cell}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={resetGame} className="flex-1">
                New Game
              </Button>
              <Button onClick={resetScores} variant="outline" className="flex-1 bg-transparent">
                Reset Score
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">Works offline • No server required</p>
      </div>
    </div>
  )
}
