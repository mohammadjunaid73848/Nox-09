import { NextResponse } from "next/server"
import { config } from "@/lib/config/env"

export async function GET() {
  console.log("[v0] ========== CONFIG STATUS DEBUG ==========")

  console.log("[v0] Raw PAYPAL_CLIENT_ID:", process.env.PAYPAL_CLIENT_ID)
  console.log("[v0] Raw PAYPAL_CLIENT_SECRET:", process.env.PAYPAL_CLIENT_SECRET)
  console.log("[v0] Raw PAYPAL_BASE_URL:", process.env.PAYPAL_BASE_URL)
  console.log("[v0] Raw PAYPAL_WEBHOOK_ID:", process.env.PAYPAL_WEBHOOK_ID)

  console.log("[v0] Config object values:")
  console.log("[v0] - clientId:", config.paypal.clientId)
  console.log("[v0] - clientSecret:", config.paypal.clientSecret)
  console.log("[v0] - baseUrl:", config.paypal.baseUrl)
  console.log("[v0] - isConfigured:", config.paypal.isConfigured)

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
    raw: {
      hasPaypalClientId: !!process.env.PAYPAL_CLIENT_ID,
      hasPaypalClientSecret: !!process.env.PAYPAL_CLIENT_SECRET,
      paypalClientIdLength: process.env.PAYPAL_CLIENT_ID?.length || 0,
      paypalClientSecretLength: process.env.PAYPAL_CLIENT_SECRET?.length || 0,
    },
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }

  console.log("[v0] Returning status:", JSON.stringify(status, null, 2))
  console.log("[v0] ========================================")

  return NextResponse.json(status)
}
