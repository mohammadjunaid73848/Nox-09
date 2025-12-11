"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

interface DefaultAvatarCardProps {
  id: string
  name: string
  description: string
  color: string
  icon: string
  personality: string
  isInstalled?: boolean
  onInstall?: (id: string) => void
}

export function DefaultAvatarCard({
  id,
  name,
  description,
  color,
  icon,
  personality,
  isInstalled,
  onInstall,
}: DefaultAvatarCardProps) {
  return (
    <div className="group">
      <Link href={`/avatar/${id}`}>
        <div className="cursor-pointer">
          <div
            className={`relative mb-3 flex justify-center overflow-hidden rounded-lg bg-gradient-to-br ${color} aspect-square hover:shadow-lg transition-shadow`}
          >
            <div className="w-full h-full flex flex-col items-center justify-center text-white">
              <div className="text-5xl mb-2">{icon}</div>
              <div className="text-xs font-semibold opacity-75">{name}</div>
            </div>
          </div>
          <h3 className="text-sm md:text-base font-semibold text-center truncate group-hover:text-primary transition-colors">
            {name}
          </h3>
        </div>
      </Link>
      <p className="text-xs text-muted-foreground text-center mt-1">{personality}</p>
      {onInstall && (
        <Button
          size="sm"
          variant={isInstalled ? "outline" : "default"}
          className="w-full mt-2"
          onClick={() => onInstall(id)}
          disabled={isInstalled}
        >
          {isInstalled ? "Installed" : "Install"}
        </Button>
      )}
    </div>
  )
}
