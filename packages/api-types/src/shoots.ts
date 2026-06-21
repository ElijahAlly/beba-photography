export type ShootStatus =
  | 'booked'
  | 'in_progress'
  | 'delivered'
  | 'paid'
  | 'cancelled';

export interface Shoot {
  id: number;
  photographerId: number;
  clientId: number;
  title: string;
  scheduledFor: string | null;
  location: string | null;
  status: ShootStatus;
  totalPriceCents: number;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateShootRequest {
  clientId: number;
  title: string;
  scheduledFor?: string;
  location?: string;
  totalPriceCents?: number;
  notes?: string;
}
