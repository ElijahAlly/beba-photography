/** A photographer/studio record, rooted in a mytrees.family user. */
export interface Photographer {
  id: number;
  mytreesUserId: string;
  email: string;
  studioName: string;
  subdomain: string;
  bio: string | null;
  createdAt: string;
}

/**
 * Body for POST /api/photographers — onboard the current user as a
 * photographer (creates the row shoots.create needs). Idempotent: if the
 * caller already has a studio, the provided fields update it.
 */
export interface OnboardPhotographerRequest {
  studioName: string;
  subdomain?: string;
  bio?: string;
}

/** Body for PATCH /api/photographers/me — edit the studio profile. */
export interface UpdatePhotographerRequest {
  studioName?: string;
  subdomain?: string;
  bio?: string;
}
