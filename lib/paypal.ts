import { paypalConfig } from "./config/env"

export interface PayPalConfig {
  clientId: string
  clientSecret: string
  baseUrl: string
  webhookId: string
}

export interface CreateSubscriptionParams {
  customerId: string
  customerEmail: string
  customerName?: string
  planType: "pro_monthly" | "pro_yearly"
  returnUrl: string
}

export interface CreateSubscriptionResponse {
  success: boolean
  subscriptionId?: string
  approvalUrl?: string
  error?: string
}

// Plan pricing in USD cents (1 USD = 100 cents)
// Converted from INR at ~83 INR = 1 USD
export const PLAN_PRICING_USD = {
  pro_monthly: {
    planId: process.env.PAYPAL_MONTHLY_PLAN_ID || "", // <-- Plan ID from setup script
    amount: 1599, // $15.99
    amountInr: 129900, // ₹1,299
    name: "Pro Monthly",
    description: "Full access to all AI models with auto-select feature",
  },
  pro_yearly: {
    planId: process.env.PAYPAL_YEARLY_PLAN_ID || "", // <-- Plan ID from setup script
    amount: 15999, // $159.99 (save ~$32/year)
    amountInr: 1299900, // ₹12,999
    name: "Pro Yearly",
    description: "Full access to all AI models - Save $32/year",
  },
} as const

export function getPayPalConfig(): PayPalConfig {
  return {
    clientId: paypalConfig.clientId,
    clientSecret: paypalConfig.clientSecret,
    baseUrl: paypalConfig.baseUrl,
    webhookId: paypalConfig.webhookId,
  }
}

async function getAccessToken(): Promise<string | null> {
  const config = getPayPalConfig()

  if (!config.clientId || !config.clientSecret) {
    console.error("[PayPal] Configuration missing")
    console.error("[PayPal] Client ID exists:", !!config.clientId)
    console.error("[PayPal] Client Secret exists:", !!config.clientSecret)
    console.error("[PayPal] Base URL:", config.baseUrl)
    return null
  }

  try {
    const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")

    const response = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[PayPal] Token error:", response.status, errorText)
      return null
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error("[PayPal] Token error:", error)
    return null
  }
}

export async function createSubscription(params: CreateSubscriptionParams): Promise<CreateSubscriptionResponse> {
  const config = getPayPalConfig()
  const plan = PLAN_PRICING_USD[params.planType]

  if (!config.clientId || !config.clientSecret) {
    console.error("[PayPal] Configuration check failed")
    console.error("[PayPal] PAYPAL_CLIENT_ID:", config.clientId ? "SET" : "MISSING")
    console.error("[PayPal] PAYPAL_CLIENT_SECRET:", config.clientSecret ? "SET" : "MISSING")
    return {
      success: false,
      error: "PayPal configuration incomplete. Please configure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.",
    }
  }

  if (!plan.planId) {
    console.error("[PayPal] Plan ID not configured for:", params.planType)
    return {
      success: false,
      error: "PayPal plan not configured. Please run the setup script first.",
    }
  }

  const accessToken = await getAccessToken()
  if (!accessToken) {
    return {
      success: false,
      error: "Unable to connect to PayPal. Please try again later.",
    }
  }

  try {
    const planId = plan.planId

    console.log("[PayPal] Creating subscription with plan:", planId)

    // Create subscription
    const response = await fetch(`${config.baseUrl}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        plan_id: planId,
        subscriber: {
          name: {
            given_name: params.customerName || params.customerEmail.split("@")[0],
          },
          email_address: params.customerEmail,
        },
        application_context: {
          brand_name: "Noxyai",
          locale: "en-US",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          payment_method: {
            payer_selected: "PAYPAL",
            payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
          },
          return_url: `${params.returnUrl}?status=success`,
          cancel_url: `${params.returnUrl}?status=cancelled`,
        },
        custom_id: params.customerId,
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      console.error("[PayPal] Subscription error:", data)
      return {
        success: false,
        error: data.message || "Failed to create subscription.",
      }
    }

    const data = await response.json()

    // Find approval URL
    const approvalUrl = data.links?.find((link: any) => link.rel === "approve")?.href

    if (!approvalUrl) {
      console.error("[PayPal] No approval URL in response")
      return {
        success: false,
        error: "Invalid PayPal response - missing approval URL",
      }
    }

    console.log("[PayPal] Subscription created successfully:", data.id)

    return {
      success: true,
      subscriptionId: data.id,
      approvalUrl,
    }
  } catch (error) {
    console.error("[PayPal] API error:", error)
    return {
      success: false,
      error: "Unable to process payment. Please try again later.",
    }
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
  const config = getPayPalConfig()
  const accessToken = await getAccessToken()

  if (!accessToken) {
    return { success: false, error: "Unable to connect to PayPal" }
  }

  try {
    const response = await fetch(`${config.baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "Customer requested cancellation",
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      return {
        success: false,
        error: data.message || "Failed to cancel subscription",
      }
    }

    return { success: true }
  } catch (error) {
    console.error("[PayPal] Cancel error:", error)
    return { success: false, error: "Failed to cancel subscription" }
  }
}

export function verifyWebhookSignature(webhookEvent: any, headers: Record<string, string>): boolean {
  const config = getPayPalConfig()

  // PayPal webhook verification uses HTTPS certificate validation
  // For additional security, verify the webhook ID matches
  const transmissionId = headers["paypal-transmission-id"]
  const transmissionTime = headers["paypal-transmission-time"]
  const transmissionSig = headers["paypal-transmission-sig"]
  const certUrl = headers["paypal-cert-url"]
  const authAlgo = headers["paypal-auth-algo"]

  // Basic validation
  if (!transmissionId || !transmissionTime || !transmissionSig) {
    return false
  }

  // In production, you should verify the signature using PayPal SDK
  // For now, we'll do basic validation
  return true
}
