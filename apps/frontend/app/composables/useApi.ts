/**
 * Thin wrapper around $fetch that hard-codes credentials: 'include' (so the
 * httpOnly session cookie set by the NestJS backend rides along) and pins
 * the base URL to NUXT_PUBLIC_API_BASE. Returns a $fetch-compatible client
 * so callers get the same ergonomics they're used to.
 */
export const useApi = () => {
  const { public: { apiBase } } = useRuntimeConfig();
  return $fetch.create({
    baseURL: apiBase,
    credentials: 'include',
  });
};
