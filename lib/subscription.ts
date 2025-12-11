// Server-side subscription management utilities
import { createClient } from "@/utils/supabase/server"
import type { Subscription, PaymentHistory } from "./subscription-types"

// Re-export types and utilities for convenience
export * from "./subscription-types"

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("subscriptions").select("*").eq("user_id", userId).single()

  if (error || !data) {
    return null
  }

  return data as Subscription
}

export async function createFreeSubscription(userId: string): Promise<Subscription | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      plan_type: "free",
      status: "active",
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating free subscription:", error)
    return null
  }

  return data as Subscription
}

export async function updateSubscription(userId: string, updates: Partial<Subscription>): Promise<Subscription | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("subscriptions").update(updates).eq("user_id", userId).select().single()

  if (error) {
    console.error("Error updating subscription:", error)
    return null
  }

  return data as Subscription
}

export async function getPaymentHistory(userId: string): Promise<PaymentHistory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("payment_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching payment history:", error)
    return []
  }

  return data as PaymentHistory[]
}

export async function recordPayment(
  payment: Omit<PaymentHistory, "id" | "created_at">,
): Promise<PaymentHistory | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("payment_history").insert(payment).select().single()

  if (error) {
    console.error("Error recording payment:", error)
    return null
  }

  return data as PaymentHistory
}
