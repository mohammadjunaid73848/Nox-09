import { generateModelLogo } from "@/lib/generate-model-logos"

interface ModelLogoProps {
  modelName: string
  className?: string
}

export function ModelLogo({ modelName, className = "w-16 h-16" }: ModelLogoProps) {
  const svgLogo = generateModelLogo(modelName)

  return <div className={className} dangerouslySetInnerHTML={{ __html: svgLogo }} style={{ display: "inline-block" }} />
}
