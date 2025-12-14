import { NextResponse } from "next/server"
import { config } from "@/lib/config/env"

export async function GET() {
  console.log("[v0] Config status requested")
  console.log("[v0] PayU configured:", config.payu.isConfigured)
  console.log("[v0] PayPal configured:", config.paypal.isConfigured)

  const status = {
    payu: {
      isConfigured: config.payu.isConfigured,
      key: config.payu.key ? config.payu.key.substring(0, 10) + "..." : null,
      salt: config.payu.salt ? config.payu.salt.substring(0, 10) + "..." : null,
      baseUrl: config.payu.baseUrl,
    },
    paypal: {
      isConfigured: config.paypal.isConfigured,
      clientId: config.paypal.clientId ? config.paypal.clientId.substring(0, 15) + "..." : null,
      clientSecret: config.paypal.clientSecret ? config.paypal.clientSecret.substring(0, 10) + "..." : null,
      baseUrl: config.paypal.baseUrl,
      webhookId: config.paypal.webhookId || null,
    },
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }

  console.log("[v0] Returning status:", JSON.stringify(status, null, 2))

  return NextResponse.json(status)
}
