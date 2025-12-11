// Pay.in Payment Gateway Integration
// Supports autopay/recurring payments with webhook processing

export interface PayinConfig {
  baseUrl: string
  merchantId: string
  apiKey: string
  webhookSecret: string
}

export interface CreateSubscriptionParams {
  customerId: string
  customerEmail: string
  customerPhone?: string
  planType: "pro_monthly" | "pro_yearly"
  returnUrl: string
  webhookUrl: string
}

export interface CreateSubscriptionResponse {
  success: boolean
  subscriptionId?: string
  mandateId?: string
  paymentUrl?: string
  error?: string
}

export interface WebhookPayload {
  event:
    | "subscription.created"
    | "subscription.activated"
    | "payment.success"
    | "payment.failed"
    | "subscription.cancelled"
    | "mandate.created"
    | "mandate.revoked"
  subscriptionId: string
  mandateId?: string
  transactionId?: string
  amount?: number
  status: string
  timestamp: string
  data: Record<string, unknown>
}

// Plan pricing in paisa (1 INR = 100 paisa)
export const PLAN_PRICING = {
  pro_monthly: {
    amount: 129900, // ₹1,299
    interval: "month",
    intervalCount: 1,
    name: "Pro Monthly",
    description: "Full access to all AI models with auto-select feature",
  },
  pro_yearly: {
    amount: 2100000, // ₹21,000
    interval: "year",
    intervalCount: 1,
    name: "Pro Yearly",
    description: "Full access to all AI models - Save ₹5,588/year",
  },
} as const

export function getPayinConfig(): PayinConfig {
  const baseUrl = process.env.PAYIN_BASE_URL || process.env.NEXT_PUBLIC_PAYIN_BASE_URL || "https://api.pay.in"
  const merchantId = process.env.PAYIN_MERCHANT_ID || ""
  const apiKey = process.env.PAYIN_API_KEY || ""
  const webhookSecret = process.env.PAYIN_WEBHOOK_SECRET || ""

  return { baseUrl, merchantId, apiKey, webhookSecret }
}

export async function createSubscription(params: CreateSubscriptionParams): Promise<CreateSubscriptionResponse> {
  const config = getPayinConfig()
  const plan = PLAN_PRICING[params.planType]

  try {
    const response = await fetch(`${config.baseUrl}/v1/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Merchant-Id": config.merchantId,
        "X-Api-Key": config.apiKey,
      },
      body: JSON.stringify({
        customer_id: params.customerId,
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone,
        plan: {
          amount: plan.amount,
          currency: "INR",
          interval: plan.interval,
          interval_count: plan.intervalCount,
          name: plan.name,
          description: plan.description,
        },
        autopay: {
          enabled: true,
          mandate_type: "recurring",
          max_amount: plan.amount * 1.1, // 10% buffer for price changes
          grace_period_days: 3, // Wait 3 days for payment
        },
        return_url: params.returnUrl,
        webhook_url: params.webhookUrl,
        metadata: {
          plan_type: params.planType,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to create subscription",
      }
    }

    return {
      success: true,
      subscriptionId: data.subscription_id,
      mandateId: data.mandate_id,
      paymentUrl: data.payment_url,
    }
  } catch (error) {
    console.error("Pay.in API error:", error)
    return {
      success: false,
      error: "Payment gateway connection failed",
    }
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
  const config = getPayinConfig()

  try {
    const response = await fetch(`${config.baseUrl}/v1/subscriptions/${subscriptionId}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Merchant-Id": config.merchantId,
        "X-Api-Key": config.apiKey,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to cancel subscription",
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Pay.in cancel error:", error)
    return {
      success: false,
      error: "Failed to cancel subscription",
    }
  }
}

// This function should only be called from API routes (server-side)
export async function verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
  // Dynamic import for crypto to avoid client-side issues
  const crypto = await import("crypto")
  const config = getPayinConfig()

  const expectedSignature = crypto.createHmac("sha256", config.webhookSecret).update(payload).digest("hex")

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  } catch {
    return false
  }
}

export function getSubscriptionStatus(subscriptionId: string): Promise<any> {
  const config = getPayinConfig()

  return fetch(`${config.baseUrl}/v1/subscriptions/${subscriptionId}`, {
    headers: {
      "X-Merchant-Id": config.merchantId,
      "X-Api-Key": config.apiKey,
    },
  }).then((res) => res.json())
}
