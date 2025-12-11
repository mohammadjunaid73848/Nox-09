import crypto from "crypto"

export interface PayUConfig {
  key: string
  salt: string
  baseUrl: string
}

export interface CreateSubscriptionParams {
  customerId: string
  customerEmail: string
  customerPhone?: string
  planType: "pro_monthly" | "pro_yearly"
  returnUrl: string
}

export interface CreateSubscriptionResponse {
  success: boolean
  paymentUrl?: string
  error?: string
}

// Plan pricing in paisa (1 INR = 100 paisa)
export const PLAN_PRICING = {
  pro_monthly: {
    amount: 129900, // ₹1,299
    name: "Pro Monthly",
    description: "Full access to all AI models with auto-select feature",
  },
  pro_yearly: {
    amount: 2100000, // ₹21,000
    name: "Pro Yearly",
    description: "Full access to all AI models - Save ₹5,588/year",
  },
} as const

export function getPayUConfig(): PayUConfig {
  return {
    key: process.env.PAYU_KEY || "",
    salt: process.env.PAYU_SALT || "",
    baseUrl: process.env.PAYU_BASE_URL || "https://secure.payu.in",
  }
}

export function generatePayUHash(command: string, var1: string, salt: string, key: string): string {
  // Hash format: sha512(key|command|var1|salt)
  const hashString = `${key}|${command}|${var1}|${salt}`
  return crypto.createHash("sha512").update(hashString).digest("hex")
}

export async function createSubscription(params: CreateSubscriptionParams): Promise<CreateSubscriptionResponse> {
  const config = getPayUConfig()
  const plan = PLAN_PRICING[params.planType]

  if (!config.key || !config.salt) {
    const missingVars = []
    if (!config.key) missingVars.push("PAYU_KEY")
    if (!config.salt) missingVars.push("PAYU_SALT")

    const errorMsg = `Payment gateway configuration incomplete. Missing: ${missingVars.join(", ")}. Please configure these environment variables in your Vercel project settings.`
    console.error("[v0]", errorMsg)
    return {
      success: false,
      error: errorMsg,
    }
  }

  try {
    const txnid = `TXN${Date.now()}_${params.customerId.substring(0, 8)}`
    const productinfo = params.planType === "pro_yearly" ? "Pro Yearly Subscription" : "Pro Monthly Subscription"

    // PayU Web Checkout requires these parameters
    const payuParams = {
      key: config.key,
      txnid: txnid,
      amount: (plan.amount / 100).toString(), // Convert to INR
      productinfo: productinfo,
      firstname: params.customerEmail.split("@")[0],
      email: params.customerEmail,
      phone: params.customerPhone || "",
      surl: params.returnUrl,
      furl: params.returnUrl.replace("?status=success", "?status=failed"),
      udf1: params.planType,
      udf2: params.customerId,
    }

    // Generate hash for PayU authentication
    const hashInput = `${config.key}|${payuParams.txnid}|${payuParams.amount}|${payuParams.productinfo}|${payuParams.firstname}|${payuParams.email}|${payuParams.udf1}|${payuParams.udf2}|||||||${config.salt}`
    const hash = crypto.createHash("sha512").update(hashInput).digest("hex")

    // Build payment URL with all parameters
    const paymentParams = new URLSearchParams({
      ...payuParams,
      hash: hash,
    })

    const paymentUrl = `${config.baseUrl}/_payment`

    console.log("[v0] PayU subscription created:", { txnid, amount: payuParams.amount, email: params.customerEmail })

    return {
      success: true,
      paymentUrl: `${paymentUrl}?${paymentParams.toString()}`,
    }
  } catch (error) {
    console.error("[v0] PayU API error:", error)
    return {
      success: false,
      error: "Unable to process payment. Please try again later.",
    }
  }
}
