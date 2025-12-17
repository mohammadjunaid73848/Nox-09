import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Noxy - Free AI Assistant | Better than ChatGPT & Grok",
    template: "%s | Noxy AI Assistant",
  },
  description:
    "Noxy is a free AI assistant powered by advanced AI models. Get instant answers, web search, image generation, code help, and real-time information. Better than ChatGPT, Grok, Claude, and Gemini. Try the best free AI chat now!",
  keywords: [
    "AI assistant",
    "free AI chat",
    "ChatGPT alternative",
    "Grok alternative",
    "Claude alternative",
    "Gemini alternative",
    "best AI chatbot",
    "free chatbot",
    "AI chat online",
    "conversational AI",
    "artificial intelligence assistant",
    "smart AI helper",
    "AI for students",
    "AI for developers",
    "AI code assistant",
    "AI image generator",
    "web search AI",
    "real-time AI",
    "advanced AI models",
    "machine learning chat",
    "natural language AI",
    "intelligent assistant",
    "virtual AI assistant",
    "AI productivity tool",
    "free AI tool",
    "no signup AI",
    "instant AI answers",
    "AI question answering",
    "AI research assistant",
    "AI writing helper",
    "Noxy AI",
    "NoxyAI",
  ],
  authors: [{ name: "Noxy AI" }],
  creator: "Noxy AI",
  publisher: "Noxy AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.noxyai.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Noxy - Free AI Assistant | Better than ChatGPT & Grok",
    description:
      "Free AI assistant with web search, image generation, and real-time answers. Powered by advanced AI models. Try the best ChatGPT alternative now!",
    url: "https://www.noxyai.com",
    siteName: "Noxy AI Assistant",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo-black.png",
        width: 1200,
        height: 630,
        alt: "Noxy AI Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Noxy - Free AI Assistant | Better than ChatGPT & Grok",
    description:
      "Free AI assistant with web search, image generation, and real-time answers. Try the best ChatGPT alternative now!",
    images: ["/logo-black.png"],
    creator: "@noxyai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  generator: "Next.js",
  applicationName: "Noxy AI Assistant",
  referrer: "origin-when-cross-origin",
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Noxy AI Assistant",
    startupImage: ["/logo-black.png"],
  },
  icons: [
    { rel: "icon", url: "/favicon.png", type: "image/png", sizes: "32x32" },
    { rel: "apple-touch-icon", url: "/logo-black.png", sizes: "192x192" },
    { rel: "shortcut icon", url: "/favicon.png" },
  ],
  verification: {
    google: "your-google-verification-code", // Replace with actual verification code
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
} as const

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Noxy AI Assistant",
              description:
                "Free AI assistant with web search, image generation, and real-time answers. Powered by advanced AI models. Try the best ChatGPT alternative now!",
              url: "https://www.noxyai.com",
              applicationCategory: "UtilityApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "1250",
              },
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(
                    (registration) => {
                      console.log('[v0] Service Worker registered:', registration.scope);
                    },
                    (error) => {
                      console.log('[v0] Service Worker registration failed:', error);
                    }
                  );
                });
              }
              
              (function() {
                const savedLang = localStorage.getItem('language');
                if (savedLang) {
                  document.documentElement.lang = savedLang;
                }
                
                const savedFont = localStorage.getItem('font');
                if (savedFont) {
                  const fontClasses = {
                    'geist': 'font-sans',
                    'inter': 'font-inter',
                    'roboto': 'font-roboto',
                    'opensans': 'font-open-sans',
                    'lato': 'font-lato',
                    'montserrat': 'font-montserrat',
                    'poppins': 'font-poppins',
                    'playfair': 'font-playfair',
                    'sourcecodepro': 'font-source-code-pro',
                    'noto': 'font-noto-sans'
                  };
                  const fontClass = fontClasses[savedFont] || 'font-sans';
                  document.documentElement.classList.add(fontClass);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
