import type { SessionResponse, SessionUser } from '@cinderella/api-types';

/**
 * Single source of truth for "is the viewer signed in, and as whom" across
 * the app. The state is module-level (via useState) so multiple pages and
 * the header read from the same ref without thrashing the backend.
 */
export const useSession = () => {
  const session = useState<SessionResponse | null>('session', () => null);
  const loading = useState<boolean>('session.loading', () => false);
  const api = useApi();

  const refresh = async () => {
    loading.value = true;
    try {
      session.value = await api<SessionResponse>('/api/auth/session');
    } catch {
      session.value = { authenticated: false, user: null };
    } finally {
      loading.value = false;
    }
  };

  const goLogin = (returnTo?: string) => {
    const { public: { apiBase } } = useRuntimeConfig();
    const target = returnTo ?? (import.meta.client ? window.location.href : '/');
    window.location.href = `${apiBase}/api/auth/login?return_to=${encodeURIComponent(target)}`;
  };

  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' });
    session.value = { authenticated: false, user: null };
    if (import.meta.client) window.location.href = '/';
  };

  const user = computed<SessionUser | null>(() => session.value?.user ?? null);
  const isAuthed = computed(() => !!session.value?.authenticated);

  return { session, user, isAuthed, loading, refresh, goLogin, logout };
};
