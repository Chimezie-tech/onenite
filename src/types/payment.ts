export type PlanId = "weekly" | "monthly" | "yearly";
export type PaymentMethod = "telegram_stars" | "flutterwave";

export interface Subscription {
  id: string;
  user_id: string;             // FK -> profiles.id
  plan: PlanId;
  payment_method: PaymentMethod;
  payment_id: string | null;   // Telegram Stars / Flutterwave transaction ref
  amount: number;
  status: "active" | "expired" | "cancelled";
  started_at: string;
  expires_at: string;
}