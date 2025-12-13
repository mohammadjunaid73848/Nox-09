// Promo code validation and application logic
export interface PromoCode {
  code: string
  discountType: "fixed" | "percentage" | "free_tier"
  discountValue: number // In INR for fixed, percentage for percentage, days for free
  maxUses: number | null
  expiresAt: string | null
  applicablePlans: ("pro_monthly" | "pro_yearly")[]
}

// Hidden promo codes database (not exposed to client)
const PROMO_CODES: Record<string, PromoCode> = {
  JUNAID0041W: {
    code: "JUNAID0041W",
    discountType: "free_tier",
    discountValue: 365, // 1 year free
    maxUses: null,
    expiresAt: null,
    applicablePlans: ["pro_yearly"],
  },
}

export function validatePromoCode(code: string, planType: "pro_monthly" | "pro_yearly"): PromoCode | null {
  const normalizedCode = code.toUpperCase().trim()
  const promo = PROMO_CODES[normalizedCode]

  if (!promo) return null
  if (!promo.applicablePlans.includes(planType)) return null
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return null

  return promo
}

export function applyPromoCode(
  originalAmount: number,
  promo: PromoCode,
  planType: string,
): { discountAmount: number; finalAmount: number; isFreeFirstYear: boolean } {
  if (promo.discountType === "fixed") {
    const discountAmount = Math.min(promo.discountValue, originalAmount)
    return {
      discountAmount,
      finalAmount: originalAmount - discountAmount,
      isFreeFirstYear: false,
    }
  } else if (promo.discountType === "percentage") {
    const discountAmount = Math.round(originalAmount * (promo.discountValue / 100))
    return {
      discountAmount,
      finalAmount: originalAmount - discountAmount,
      isFreeFirstYear: false,
    }
  } else if (promo.discountType === "free_tier" && planType === "pro_yearly") {
    // 1 year free - amount is 0
    return {
      discountAmount: originalAmount,
      finalAmount: 0,
      isFreeFirstYear: true,
    }
  }

  return {
    discountAmount: 0,
    finalAmount: originalAmount,
    isFreeFirstYear: false,
  }
}
