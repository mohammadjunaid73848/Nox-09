import { NextResponse } from "next/server"
import { paypalConfig } from "@/lib/config/env"

export async function GET() {
  return NextResponse.json({
    clientId: paypalConfig.clientId,
    isConfigured: paypalConfig.isConfigured,
  })
}
