/**
 * One-Time PayPal Plan Setup Script
 *
 * This script creates the Product and Billing Plans in your PayPal account.
 * Run this ONCE to get your Plan IDs, then add them to your environment variables.
 *
 * Usage: node scripts/setup-paypal-plans.ts (or execute in v0)
 */

import { paypalConfig } from "../lib/config/env"

interface PlanSetupResult {
  success: boolean
  productId?: string
  monthlyPlanId?: string
  yearlyPlanId?: string
  error?: string
}

async function getAccessToken(): Promise<string | null> {
  const config = paypalConfig

  if (!config.clientId || !config.clientSecret) {
    console.error("❌ PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set")
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
      console.error("❌ Failed to get access token:", response.status, errorText)
      return null
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error("❌ Token error:", error)
    return null
  }
}

async function createProduct(accessToken: string): Promise<string | null> {
  const config = paypalConfig

  try {
    console.log("📦 Creating PayPal product...")

    const response = await fetch(`${config.baseUrl}/v1/catalogs/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "SuperNoxy Pro Subscription",
        description: "Access to all AI models and premium features",
        type: "SERVICE",
        category: "SOFTWARE",
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("❌ Product creation failed:", data)
      return null
    }

    console.log("✅ Product created:", data.id)
    return data.id
  } catch (error) {
    console.error("❌ Product creation error:", error)
    return null
  }
}

async function createPlan(
  productId: string,
  planType: "monthly" | "yearly",
  accessToken: string,
): Promise<string | null> {
  const config = paypalConfig

  const isYearly = planType === "yearly"
  const amount = isYearly ? "159.99" : "15.99"
  const name = isYearly ? "Pro Yearly" : "Pro Monthly"
  const description = isYearly
    ? "Full access to all AI models - Save $32/year"
    : "Full access to all AI models with auto-select feature"

  try {
    console.log(`📋 Creating ${planType} plan...`)

    const response = await fetch(`${config.baseUrl}/v1/billing/plans`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        product_id: productId,
        name: name,
        description: description,
        status: "ACTIVE",
        billing_cycles: [
          {
            frequency: {
              interval_unit: isYearly ? "YEAR" : "MONTH",
              interval_count: 1,
            },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0, // Infinite billing
            pricing_scheme: {
              fixed_price: {
                value: amount,
                currency_code: "USD",
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`❌ ${planType} plan creation failed:`, data)
      return null
    }

    console.log(`✅ ${planType} plan created:`, data.id)
    return data.id
  } catch (error) {
    console.error(`❌ ${planType} plan creation error:`, error)
    return null
  }
}

export async function setupPayPalPlans(): Promise<PlanSetupResult> {
  console.log("🚀 Starting PayPal Plan Setup...")
  console.log("📍 Base URL:", paypalConfig.baseUrl)
  console.log("🔐 Client ID:", paypalConfig.clientId ? "✓ Set" : "✗ Missing")
  console.log("🔐 Client Secret:", paypalConfig.clientSecret ? "✓ Set" : "✗ Missing")
  console.log("")

  const accessToken = await getAccessToken()
  if (!accessToken) {
    return {
      success: false,
      error: "Failed to authenticate with PayPal",
    }
  }

  console.log("✅ Authentication successful")
  console.log("")

  // Step 1: Create Product
  const productId = await createProduct(accessToken)
  if (!productId) {
    return {
      success: false,
      error: "Failed to create product",
    }
  }

  console.log("")

  // Step 2: Create Monthly Plan
  const monthlyPlanId = await createPlan(productId, "monthly", accessToken)
  if (!monthlyPlanId) {
    return {
      success: false,
      productId,
      error: "Failed to create monthly plan",
    }
  }

  console.log("")

  // Step 3: Create Yearly Plan
  const yearlyPlanId = await createPlan(productId, "yearly", accessToken)
  if (!yearlyPlanId) {
    return {
      success: false,
      productId,
      monthlyPlanId,
      error: "Failed to create yearly plan",
    }
  }

  console.log("")
  console.log("=".repeat(80))
  console.log("🎉 SUCCESS! PayPal plans created successfully!")
  console.log("=".repeat(80))
  console.log("")
  console.log("📝 Add these environment variables to your project:")
  console.log("")
  console.log(`PAYPAL_PRODUCT_ID=${productId}`)
  console.log(`PAYPAL_MONTHLY_PLAN_ID=${monthlyPlanId}`)
  console.log(`PAYPAL_YEARLY_PLAN_ID=${yearlyPlanId}`)
  console.log("")
  console.log("=".repeat(80))

  return {
    success: true,
    productId,
    monthlyPlanId,
    yearlyPlanId,
  }
}

// Run the setup
setupPayPalPlans().catch((error) => {
  console.error("❌ Setup failed:", error)
  process.exit(1)
})
