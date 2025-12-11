// Generate colorful SVG logos for default AI models
export function generateModelLogo(modelName: string): string {
  const logos: Record<string, string> = {
    "qwen-3-coder-480b": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="qwenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FF6B6B;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FF1744;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#qwenGrad)" rx="20"/>
        <text x="50" y="55" font-size="32" font-weight="bold" fill="white" text-anchor="middle" font-family="monospace">&lt;/&gt;</text>
      </svg>
    `,
    "qwen-3-235b-a22b-instruct-2507": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="qwenInstructGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#qwenInstructGrad)" rx="20"/>
        <circle cx="30" cy="30" r="8" fill="white" opacity="0.8"/>
        <circle cx="70" cy="30" r="8" fill="white" opacity="0.8"/>
        <circle cx="50" cy="70" r="8" fill="white" opacity="0.8"/>
        <line x1="30" y1="30" x2="50" y2="70" stroke="white" stroke-width="2" opacity="0.6"/>
        <line x1="70" y1="30" x2="50" y2="70" stroke="white" stroke-width="2" opacity="0.6"/>
      </svg>
    `,
    "qwen-3-235b-a22b-thinking-2507": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="thinkingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#06B6D4;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0891B2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#thinkingGrad)" rx="20"/>
        <circle cx="50" cy="50" r="25" fill="none" stroke="white" stroke-width="2"/>
        <circle cx="50" cy="50" r="15" fill="none" stroke="white" stroke-width="2" opacity="0.6"/>
        <circle cx="50" cy="50" r="5" fill="white"/>
      </svg>
    `,
    "gpt-oss-120b": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gptGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#gptGrad)" rx="20"/>
        <path d="M 50 25 L 75 75 L 25 75 Z" fill="white" opacity="0.9"/>
        <circle cx="50" cy="50" r="12" fill="url(#gptGrad)"/>
      </svg>
    `,
    "llama-4-scout-17b-16e-instruct": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="llamaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#F59E0B;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#D97706;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#llamaGrad)" rx="20"/>
        <circle cx="50" cy="35" r="12" fill="white"/>
        <rect x="40" y="50" width="20" height="30" fill="white" rx="4"/>
        <circle cx="35" cy="75" r="6" fill="white"/>
        <circle cx="65" cy="75" r="6" fill="white"/>
      </svg>
    `,
    "qwen-3-32b": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="qwen32Grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#EC4899;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#DB2777;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#qwen32Grad)" rx="20"/>
        <rect x="25" y="25" width="15" height="50" fill="white" opacity="0.8"/>
        <rect x="45" y="20" width="15" height="60" fill="white" opacity="0.8"/>
        <rect x="65" y="30" width="15" height="45" fill="white" opacity="0.8"/>
      </svg>
    `,
    "llama-3.3-70b": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="llama70Grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#6D28D9;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#llama70Grad)" rx="20"/>
        <circle cx="50" cy="40" r="15" fill="white" opacity="0.9"/>
        <path d="M 35 55 Q 35 70 50 75 Q 65 70 65 55" fill="white" opacity="0.8"/>
        <circle cx="42" cy="38" r="4" fill="url(#llama70Grad)"/>
        <circle cx="58" cy="38" r="4" fill="url(#llama70Grad)"/>
      </svg>
    `,
    "llama-3.1-8b": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="llama8Grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#14B8A6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0D9488;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#llama8Grad)" rx="20"/>
        <circle cx="50" cy="45" r="12" fill="white" opacity="0.9"/>
        <rect x="38" y="60" width="24" height="20" fill="white" opacity="0.8" rx="3"/>
        <circle cx="42" cy="42" r="3" fill="url(#llama8Grad)"/>
        <circle cx="58" cy="42" r="3" fill="url(#llama8Grad)"/>
      </svg>
    `,
  }

  return logos[modelName] || generateDefaultLogo(modelName)
}

function generateDefaultLogo(modelName: string): string {
  // Generate a unique color based on model name
  let hash = 0
  for (let i = 0; i < modelName.length; i++) {
    hash = (hash << 5) - hash + modelName.charCodeAt(i)
    hash = hash & hash
  }

  const hue = Math.abs(hash) % 360
  const colors = [`hsl(${hue}, 70%, 60%)`, `hsl(${(hue + 120) % 360}, 70%, 60%)`]

  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="defaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors[1]};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#defaultGrad)" rx="20"/>
      <text x="50" y="60" font-size="28" font-weight="bold" fill="white" text-anchor="middle" font-family="system-ui">
        ${modelName.charAt(0).toUpperCase()}
      </text>
    </svg>
  `
}
