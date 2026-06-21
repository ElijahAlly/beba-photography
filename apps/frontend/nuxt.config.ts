// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  // Nuxt 4.4.5 + ssr:false alone trips resolveServerEntry in @nuxt/vite-builder.
  // Enabling the Vite environment API populates the ssr environment so the lookup succeeds.
  experimental: { viteEnvironmentApi: true },
  // Local dev runs alongside family-trees (the IdP) on :3000, so cinderella's
  // frontend uses :3002. The Dockerized stack overrides via NUXT_PORT.
  devServer: { port: 3002 },
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
    },
  },
});
