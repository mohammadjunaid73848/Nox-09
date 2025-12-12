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
  const key = (process.env.PAYU_KEY || "").trim()
  let salt = (process.env.PAYU_SALT || "").trim()

  // FORCE CORRECT SALT FOR TEST ENVIRONMENT
  // PayU often fails if you use the test key 'gtKFFx' with a mismatched salt.
  // The error log explicitly requested salt: '4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW'
  if (key === "gtKFFx") {
    console.log("[v0] PayU Test Mode detected. Enforcing correct test salt.")
    salt = "4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW"
  }

  return {
    key,
    salt,
    baseUrl: process.env.PAYU_BASE_URL || "https://test.payu.in", // Default to test URL if not set
  }
}

export function generatePayUHash(command: string, var1: string, salt: string, key: string): string {
  // Hash format for API commands: sha512(key|command|var1|salt)
  const hashString = `${key}|${command}|${var1}|${salt}`
  return crypto.createHash("sha512").update(hashString).digest("hex")
}

export async function createSubscription(params: CreateSubscriptionParams): Promise<CreateSubscriptionResponse> {
  const config = getPayUConfig()
  const plan = PLAN_PRICING[params.planType]

  if (!config.key || !config.salt) {
    const missingVars = []
    if (!config.key) missingVars.push("PAYU_KEY")
    const errorMsg = `Payment gateway configuration incomplete. Missing: ${missingVars.join(", ")}. Please configure these environment variables.`
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

    const firstname = (params.customerEmail.split("@")[0] || "Customer").trim()
    const email = params.customerEmail.trim()
    const phone = params.customerPhone || "9999999999"

    const udf1 = params.planType
    const udf2 = params.customerId

    // Standard PayU Sequence for Payment Request:
    // key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt
    const hashFields = [
      config.key, // key
      txnid, // txnid
      amount, // amount
      productinfo, // productinfo
      firstname, // firstname
      email, // email
      udf1, // udf1
      udf2, // udf2
      "", // udf3
      "", // udf4
      "", // udf5
      "", // udf6
      "", // udf7
      "", // udf8
      "", // udf9
      "", // udf10
      config.salt, // salt
    ]

    // Join with pipes. This guarantees exactly 16 pipes for 17 fields.
    const hashInput = hashFields.join("|")

    // Debug log to verify the exact string being hashed
    console.log("[v0] PayU Hash Input:", hashInput)

    const hash = crypto.createHash("sha512").update(hashInput).digest("hex")

    const baseUrl = params.returnUrl.replace(/\/subscription.*$/, "")
    const surl = `${baseUrl}/subscription/success?txnid=${txnid}`
    const furl = `${baseUrl}/subscription/failed?txnid=${txnid}`

    const formData = {
      key: config.key,
      txnid: txnid,
      amount: amount,
      productinfo: productinfo,
      firstname: firstname,
      email: email,
      phone: phone,
      surl: surl,
      furl: furl,
      udf1: udf1,
      udf2: udf2,
      udf3: "",
      udf4: "",
      udf5: "",
      hash: hash,
    }

    const isTestMode = config.key === "gtKFFx"
    const paymentUrl = isTestMode ? "https://test.payu.in/_payment" : config.baseUrl + "/_payment"

    return {
      success: true,
      paymentUrl,
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
