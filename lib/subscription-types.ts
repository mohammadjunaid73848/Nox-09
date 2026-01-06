// Shared subscription types and constants - can be used in both client and server
export type PlanType = "free" | "pro_monthly" | "pro_yearly"
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "pending" | "payment_due"
export type AutoPayMethod = "upi" | "card" | null

export interface Subscription {
  id: string
  user_id: string
  plan_type: PlanType
  status: SubscriptionStatus
  payment_gateway: string
  subscription_id: string | null
  mandate_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  next_billing_date: string | null
  amount_inr: number | null
  last_payment_date: string | null
  last_payment_status: string | null
  payment_retry_count: number
  payment_due_date: string | null
  created_at: string
  updated_at: string
  cancelled_at: string | null
  promo_code_used: string | null
  auto_pay_enabled: boolean
  auto_pay_method: AutoPayMethod
  discount_amount_inr: number | null
  is_free_trial: boolean
}

export interface PaymentHistory {
  id: string
  user_id: string
  subscription_id: string | null
  transaction_id: string | null
  gateway_payment_id: string | null
  amount_inr: number
  currency: string
  status: "pending" | "success" | "failed" | "refunded"
  payment_method: string | null
  gateway_response: Record<string, unknown> | null
  created_at: string
  completed_at: string | null
}

// Free plan model access
export const FREE_PLAN_MODELS = ["nvidia-cosmos-reason2-8b"]

export function isPro(subscription: Subscription | null): boolean {
  if (!subscription) return false
  // Pro users with active or payment_due status can still access features during grace period
  return (
    (subscription.plan_type === "pro_monthly" || subscription.plan_type === "pro_yearly") &&
    (subscription.status === "active" || subscription.status === "payment_due")
  )
}

export function canAccessModel(modelId: string, subscription: Subscription | null): boolean {
  // Pro users can access all models
  if (isPro(subscription)) return true

  // Free users can only access specific models
  return FREE_PLAN_MODELS.includes(modelId)
}

export function getNextBillingDate(planType: PlanType): Date {
  const now = new Date()
  if (planType === "pro_monthly") {
    return new Date(now.setMonth(now.getMonth() + 1))
  } else if (planType === "pro_yearly") {
    return new Date(now.setFullYear(now.getFullYear() + 1))
  }
  return now
}

export function addGracePeriod(date: Date, days = 3): Date {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + days)
  return newDate
}

export function isInGracePeriod(subscription: Subscription | null): boolean {
  if (!subscription || subscription.status !== "payment_due") return false

  const now = new Date()
  const dueDate = subscription.payment_due_date ? new Date(subscription.payment_due_date) : null

  if (!dueDate) return false
  return now <= dueDate
}

export function getGracePeriodDaysRemaining(subscription: Subscription | null): number {
  if (!subscription || subscription.status !== "payment_due") return 0

  const now = new Date()
  const dueDate = subscription.payment_due_date ? new Date(subscription.payment_due_date) : null

  if (!dueDate) return 0

  const diffTime = dueDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export function isOnFreeTrial(subscription: Subscription | null): boolean {
  return subscription?.is_free_trial === true
}
