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
  app: {
    head: {
      title: 'Beba Photography',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Beba Photography — private galleries you can access, download, share, and curate. Your moments, beautifully delivered.',
        },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Manrope:wght@300..700&display=swap',
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
    },
  },
});
