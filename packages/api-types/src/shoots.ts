export type ShootStatus =
  | 'booked'
  | 'in_progress'
  | 'delivered'
  | 'paid'
  | 'cancelled';

import type { PaymentMethod } from './payments';

export interface Shoot {
  id: number;
  photographerId: number;
  clientId: number;
  title: string;
  scheduledFor: string | null;
  location: string | null;
  status: ShootStatus;
  totalPriceCents: number;
  /** Which advertised package this was priced from, if any. */
  pricePackageId: string | null;
  paidAt: string | null;
  /** How it was settled once paid. */
  paymentMethod: PaymentMethod | null;
  amountPaidCents: number;
  notes: string | null;
  createdAt: string;
}

export interface CreateShootRequest {
  clientId: number;
  title: string;
  scheduledFor?: string;
  location?: string;
  totalPriceCents?: number;
  /** Optional: the advertised package the price was derived from. */
  pricePackageId?: string;
  notes?: string;
}
