/** The session a logged-in user has on cinderella.photography. */
export interface SessionUser {
  userId: string;          // mytrees.family authUsers.id
  email: string;
  displayName?: string;
  scopes: string[];
}

/** Response from GET /api/auth/session. */
export interface SessionResponse {
  authenticated: boolean;
  user: SessionUser | null;
}

/** Response from GET /api/auth/login (starts the OAuth dance). */
export interface LoginStartResponse {
  redirectUrl: string;
}

/** Body for POST /api/auth/callback. */
export interface CallbackRequest {
  code: string;
  state: string;
}

export interface CallbackResponse {
  user: SessionUser;
  expiresAt: string;
}
