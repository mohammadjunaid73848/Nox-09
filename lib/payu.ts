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
  formData?: Record<string, string>
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
    const amount = (plan.amount / 100).toFixed(2) // Convert paisa to INR with 2 decimal places

    const firstname = params.customerEmail.split("@")[0] || "Customer"
    const phone = params.customerPhone || "9999999999"

    // Hash format: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
    // After udf5, there are 5 more empty fields before salt (total 8 empty fields after udf2)
    const udf1 = params.planType
    const udf2 = params.customerId
    const udf3 = ""
    const udf4 = ""
    const udf5 = ""

    // Build hash string exactly as PayU expects - 8 empty fields after udf2 (9 pipes)
    const hashInput = [
      config.key,
      txnid,
      amount,
      productinfo,
      firstname,
      params.customerEmail,
      udf1,
      udf2,
      udf3, // empty
      udf4, // empty
      udf5, // empty
      "", // empty field 6
      "", // empty field 7
      "", // empty field 8
      "", // empty field 9
      "", // empty field 10
      config.salt,
    ].join("|")

    const hash = crypto.createHash("sha512").update(hashInput).digest("hex")

    // Log the full hash input for debugging
    console.log("[v0] PayU Hash Debug:", {
      hashInput: hashInput,
      generatedHash: hash,
      key: config.key,
      txnid: txnid,
      amount: amount,
    })

    const formData = {
      key: config.key,
      txnid: txnid,
      amount: amount,
      productinfo: productinfo,
      firstname: firstname,
      email: params.customerEmail,
      phone: phone,
      surl: params.returnUrl,
      furl: params.returnUrl.replace("status=success", "status=failed"),
      udf1: udf1,
      udf2: udf2,
      udf3: udf3,
      udf4: udf4,
      udf5: udf5,
      hash: hash,
    }

    console.log("[v0] PayU subscription created:", {
      txnid,
      amount,
      email: params.customerEmail,
      hashLength: hash.length,
    })

    return {
      success: true,
      paymentUrl: config.baseUrl + "/_payment",
      formData,
    }
  } catch (error) {
    console.error("[v0] PayU API error:", error)
    return {
      success: false,
      error: "Unable to process payment. Please try again later.",
    }
  }
}
