/**
 * How a shoot was settled. `stripe` = paid online via Checkout; `cash` =
 * recorded manually by the photographer (cash / e-transfer / etc.);
 * `waived` = no charge (comp'd, friend, already settled off-platform).
 */
export type PaymentMethod = 'stripe' | 'cash' | 'waived';

/** Body for the manual "mark paid" / "waive" action (photographer-only). */
export interface RecordPaymentRequest {
  method: Exclude<PaymentMethod, 'stripe'>; // 'cash' | 'waived'
  /** Optional override; defaults to the shoot's total (0 for a waiver). */
  amountCents?: number;
  note?: string;
}

/** Response from creating an online (Stripe) checkout session. */
export interface CheckoutResponse {
  url: string;
}
