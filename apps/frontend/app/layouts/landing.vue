<script setup lang="ts">
const { isAuthed, refresh, goLogin } = useSession();
const { toasts, dismiss } = useToast();
const route = useRoute();

await refresh();

const scrolled = ref(false);
const menuOpen = ref(false);

const onScroll = () => {
  scrolled.value = (import.meta.client ? window.scrollY : 0) > 40;
};
onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
});
onBeforeUnmount(() => {
  if (import.meta.client) window.removeEventListener('scroll', onScroll);
});

// Close the mobile menu whenever the route changes.
watch(() => route.fullPath, () => { menuOpen.value = false; });

// Section anchors resolve against the landing home, so they work from any page.
const navLinks = [
  { to: '/#work', label: 'Work' },
  { to: '/#experience', label: 'Experience' },
  { to: '/#clients', label: 'For clients' },
  { to: '/about', label: 'About' },
];
</script>

<template>
  <div class="beba-landing min-h-[100dvh] bg-ink text-bone antialiased">
    <!-- Header -->
    <header
      class="fixed inset-x-0 top-0 z-40 transition-all duration-500"
      :class="scrolled || menuOpen ? 'border-b border-white/10 bg-ink/90 backdrop-blur-md py-3' : 'py-5 sm:py-6'"
    >
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 lg:px-10">
        <NuxtLink to="/" class="group flex items-baseline gap-[0.15em] font-display">
          <span class="text-xl font-medium tracking-tightest sm:text-2xl">Beba</span>
          <span class="text-[0.6rem] uppercase tracking-[0.35em] text-gold transition group-hover:text-gold-soft sm:text-[0.7rem]">
            photography
          </span>
        </NuxtLink>

        <nav class="hidden items-center gap-9 text-xs font-medium uppercase tracking-[0.2em] text-bone-dim md:flex">
          <NuxtLink v-for="l in navLinks" :key="l.to" :to="l.to" class="transition hover:text-bone">
            {{ l.label }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-3">
          <NuxtLink
            v-if="isAuthed"
            to="/studio"
            class="hidden rounded-full border border-gold/50 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold transition hover:bg-gold hover:text-ink sm:inline-block"
          >
            Enter studio
          </NuxtLink>
          <button
            v-else
            class="hidden rounded-full border border-bone/30 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-bone transition hover:border-gold hover:bg-gold hover:text-ink sm:inline-block"
            @click="goLogin()"
          >
            Client sign in
          </button>

          <!-- Mobile menu toggle -->
          <button
            class="-mr-2 flex h-10 w-10 items-center justify-center text-bone md:hidden"
            :aria-expanded="menuOpen"
            aria-label="Toggle menu"
            @click="menuOpen = !menuOpen"
          >
            <svg v-if="!menuOpen" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>
          </button>
        </div>
      </div>

      <!-- Mobile menu panel -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        leave-active-class="transition duration-200 ease-in"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <nav v-if="menuOpen" class="border-t border-white/10 px-6 pb-6 pt-4 md:hidden">
          <NuxtLink
            v-for="l in navLinks"
            :key="l.to"
            :to="l.to"
            class="block border-b border-white/5 py-4 font-display text-2xl font-light tracking-tight text-bone transition hover:text-gold"
          >
            {{ l.label }}
          </NuxtLink>
          <NuxtLink
            v-if="isAuthed"
            to="/studio"
            class="mt-6 block rounded-full border border-gold/50 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gold"
          >
            Enter studio
          </NuxtLink>
          <button
            v-else
            class="mt-6 block w-full rounded-full border border-bone/30 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-bone"
            @click="goLogin()"
          >
            Client sign in
          </button>
        </nav>
      </Transition>
    </header>

    <main>
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-white/10 bg-ink-soft">
      <div class="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
        <div class="lg:col-span-2">
          <div class="flex items-baseline gap-[0.15em] font-display">
            <span class="text-3xl font-medium tracking-tightest">Beba</span>
            <span class="text-[0.7rem] uppercase tracking-[0.35em] text-gold">photography</span>
          </div>
          <p class="mt-4 max-w-sm text-sm leading-relaxed text-bone-faint">
            Photographs made to be lived with. Delivered through private galleries you
            actually own — yours to keep, share, and curate.
          </p>
        </div>
        <div>
          <div class="text-[0.7rem] uppercase tracking-[0.25em] text-bone-faint">Studio</div>
          <ul class="mt-4 space-y-2 text-sm text-bone-dim">
            <li><NuxtLink to="/#work" class="transition hover:text-gold">Portfolio</NuxtLink></li>
            <li><NuxtLink to="/about" class="transition hover:text-gold">About Beba</NuxtLink></li>
            <li><NuxtLink to="/#clients" class="transition hover:text-gold">For clients</NuxtLink></li>
          </ul>
        </div>
        <div>
          <div class="text-[0.7rem] uppercase tracking-[0.25em] text-bone-faint">Get in touch</div>
          <ul class="mt-4 space-y-2 text-sm text-bone-dim">
            <li><a href="mailto:hello@beba.photography" class="transition hover:text-gold">hello@beba.photography</a></li>
            <li>
              <button class="transition hover:text-gold" @click="goLogin()">Access your gallery</button>
            </li>
          </ul>
        </div>
      </div>
      <div class="border-t border-white/10">
        <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-center text-[0.7rem] uppercase tracking-[0.2em] text-bone-faint sm:flex-row sm:text-left lg:px-10">
          <span>© {{ new Date().getFullYear() }} Beba Photography</span>
          <span>Crafted with light</span>
        </div>
      </div>
    </footer>

    <!-- Toasts -->
    <div class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto flex w-full max-w-sm items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg"
        :class="{
          'border-rose-400/40 bg-rose-950/90 text-rose-100': t.type === 'error',
          'border-emerald-400/40 bg-emerald-950/90 text-emerald-100': t.type === 'success',
          'border-white/15 bg-ink-muted text-bone': t.type === 'info',
        }"
      >
        <span>{{ t.message }}</span>
        <button class="text-xs text-bone-faint hover:text-bone" @click="dismiss(t.id)">✕</button>
      </div>
    </div>
  </div>
</template>

<style>
/* Subtle film grain over the whole landing for an analog, gallery feel. */
.beba-landing::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
</style>
