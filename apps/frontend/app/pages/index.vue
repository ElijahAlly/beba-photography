<script setup lang="ts">
definePageMeta({ layout: 'landing' });

const { goLogin, isAuthed } = useSession();

// Curated showcase imagery. These are placeholders sourced from Unsplash —
// the photographer swaps in their own delivered frames. Sizes/spans vary on
// purpose to give the gallery an editorial, gallery-wall rhythm.
const img = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const hero = img('1519741497674-611481863552', 1800);

const gallery = [
  { id: '1606216794074-735e91aa2c92', span: 'tall', cap: 'Golden hour, the Hendersons' },
  { id: '1511285560929-80b456fea0bc', span: 'wide', cap: 'A first dance' },
  { id: '1518895949257-7621c3c786d7', span: 'std', cap: 'Quiet portrait' },
  { id: '1537633552985-df8429e8048b', span: 'std', cap: 'Field & family' },
  { id: '1522673607200-164d1b6ce486', span: 'tall', cap: 'Laughter, unposed' },
  { id: '1465495976277-4387d4b0b4c6', span: 'std', cap: 'Vows' },
  { id: '1583939003579-730e3918a45a', span: 'std', cap: 'Studio light' },
  { id: '1542038784456-1ea8e935640e', span: 'wide', cap: 'The proposal' },
];

const spanClass: Record<string, string> = {
  tall: 'row-span-2',
  wide: 'sm:col-span-2',
  std: '',
};

const features = [
  {
    key: 'access',
    title: 'Access, anywhere',
    body: 'Your full gallery opens from one private link — on a phone, a laptop, a tablet. No apps to install, no passwords to remember.',
    icon: 'access',
  },
  {
    key: 'download',
    title: 'Download in full',
    body: 'Keep the high-resolution files. Save a single favourite or the entire album in one tap — print-ready, and yours to keep forever.',
    icon: 'download',
  },
  {
    key: 'share',
    title: 'Share with ease',
    body: 'Send a view-only album link to the people who matter, or post a favourite straight to socials. They see the photos, never your account.',
    icon: 'share',
  },
  {
    key: 'hide',
    title: 'Hide, never delete',
    body: 'Some moments are just for you. Hide any frame from your shared album with a tap — it stays safe in your gallery, simply unseen by family & friends.',
    icon: 'hide',
  },
];
</script>

<template>
  <!-- ░░ Hero ░░ -->
  <section class="relative flex min-h-[100svh] items-end overflow-hidden">
    <img
      :src="hero"
      alt="A couple at golden hour"
      class="absolute inset-0 h-full w-full object-cover"
    />
    <div class="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/30"></div>
    <div class="absolute inset-0 bg-gradient-to-r from-ink/70 to-transparent"></div>

    <div class="relative mx-auto w-full max-w-7xl px-6 pb-20 pt-40 lg:px-10">
      <p class="reveal text-[0.7rem] uppercase tracking-[0.4em] text-gold" style="animation-delay: 80ms">
        Portrait · Wedding · Family
      </p>
      <h1
        class="reveal mt-6 max-w-4xl font-display text-[clamp(2.75rem,8vw,6.5rem)] font-light leading-[0.95] tracking-tightest"
        style="animation-delay: 180ms"
      >
        Stories,<br /><em class="italic text-gold-soft">kept in light.</em>
      </h1>
      <p class="reveal mt-8 max-w-md text-lg leading-relaxed text-bone-dim" style="animation-delay: 320ms">
        Beba Photography makes images you'll want to live with — then hands them to you
        in a private gallery that's truly yours.
      </p>
      <div class="reveal mt-10 flex flex-wrap items-center gap-4" style="animation-delay: 440ms">
        <a
          href="#work"
          class="rounded-full bg-bone px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-gold"
        >
          View the work
        </a>
        <button
          class="group inline-flex items-center gap-2 px-2 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-bone transition hover:text-gold"
          @click="isAuthed ? navigateTo('/studio') : goLogin()"
        >
          {{ isAuthed ? 'Enter studio' : 'Access your gallery' }}
          <span class="transition-transform group-hover:translate-x-1">→</span>
        </button>
      </div>
    </div>

    <div class="absolute bottom-8 right-6 hidden items-center gap-3 text-[0.65rem] uppercase tracking-[0.3em] text-bone-faint lg:flex lg:right-10">
      <span class="h-12 w-px animate-pulse bg-bone/30"></span>
      Scroll
    </div>
  </section>

  <!-- ░░ Featured work ░░ -->
  <section id="work" class="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-[0.7rem] uppercase tracking-[0.35em] text-gold">Selected frames</p>
        <h2 class="mt-3 font-display text-4xl font-light tracking-tightest sm:text-5xl">
          A look through the lens
        </h2>
      </div>
      <p class="max-w-xs text-sm leading-relaxed text-bone-faint">
        A small selection from recent sessions. Every gallery is delivered the same way —
        beautifully, and privately.
      </p>
    </div>

    <div class="mt-12 grid auto-rows-[220px] grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:auto-rows-[260px]">
      <figure
        v-for="(g, i) in gallery"
        :key="g.id"
        class="reveal group relative overflow-hidden rounded-sm bg-ink-muted"
        :class="spanClass[g.span]"
        :style="`animation-delay: ${i * 70}ms`"
      >
        <img
          :src="img(g.id, g.span === 'wide' ? 1200 : 800)"
          :alt="g.cap"
          loading="lazy"
          class="h-full w-full object-cover transition duration-700 ease-out will-change-transform group-hover:scale-[1.06]"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
        <figcaption class="absolute bottom-0 left-0 translate-y-3 p-5 text-sm tracking-wide text-bone opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          {{ g.cap }}
        </figcaption>
      </figure>
    </div>
  </section>

  <!-- ░░ The experience (editorial split) ░░ -->
  <section id="experience" class="border-y border-white/10 bg-ink-soft">
    <div class="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:gap-20 lg:px-10 lg:py-32">
      <div class="relative">
        <img
          :src="img('1469371670807-013ccf25f16a', 1100)"
          alt="Couple portrait"
          loading="lazy"
          class="aspect-[4/5] w-full rounded-sm object-cover"
        />
        <div class="absolute -bottom-6 -right-4 hidden w-44 rotate-3 rounded-sm border-4 border-ink-soft sm:block">
          <img
            :src="img('1460978812857-470ed1c77af0', 500)"
            alt="Detail shot"
            loading="lazy"
            class="aspect-square w-full rounded-[2px] object-cover"
          />
        </div>
      </div>
      <div>
        <p class="text-[0.7rem] uppercase tracking-[0.35em] text-gold">The experience</p>
        <h2 class="mt-3 max-w-md font-display text-4xl font-light leading-[1.05] tracking-tightest sm:text-5xl">
          Unhurried, honest, <em class="italic text-gold-soft">and entirely yours.</em>
        </h2>
        <p class="mt-6 max-w-md leading-relaxed text-bone-dim">
          No stiff poses or rushed schedules. We make room for the real moments — then
          we obsess over the edit so every frame feels like the day actually felt.
        </p>
        <p class="mt-4 max-w-md leading-relaxed text-bone-faint">
          When your gallery is ready, you'll get a link that's calm, fast, and made to last.
          Browse it, download it, share what you love, and quietly tuck away what you don't.
        </p>
      </div>
    </div>
  </section>

  <!-- ░░ For clients (the four capabilities) ░░ -->
  <section id="clients" class="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
    <div class="max-w-2xl">
      <p class="text-[0.7rem] uppercase tracking-[0.35em] text-gold">For clients</p>
      <h2 class="mt-3 font-display text-4xl font-light tracking-tightest sm:text-5xl">
        Your gallery, your rules
      </h2>
      <p class="mt-5 leading-relaxed text-bone-dim">
        Delivery shouldn't be the hard part. Beba galleries are built so you can find,
        keep, and curate every image without a second thought.
      </p>
    </div>

    <div class="mt-14 grid gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
      <article
        v-for="f in features"
        :key="f.key"
        class="group flex flex-col gap-5 bg-ink p-8 transition-colors duration-300 hover:bg-ink-soft"
      >
        <span class="text-gold transition-transform duration-300 group-hover:-translate-y-0.5">
          <!-- access -->
          <svg v-if="f.icon === 'access'" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>
          <!-- download -->
          <svg v-else-if="f.icon === 'download'" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 21h14"/></svg>
          <!-- share -->
          <svg v-else-if="f.icon === 'share'" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8 15.8 6.2M8.2 13.2l7.6 4.6"/></svg>
          <!-- hide -->
          <svg v-else width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 6.2A9.7 9.7 0 0 1 12 6c5 0 9 6 9 6a16 16 0 0 1-2.4 2.9M6.6 6.6A16 16 0 0 0 3 12s4 6 9 6a9.6 9.6 0 0 0 3.6-.7"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>
        </span>
        <h3 class="font-display text-2xl font-light tracking-tight">{{ f.title }}</h3>
        <p class="text-sm leading-relaxed text-bone-faint">{{ f.body }}</p>
        <span
          v-if="f.key === 'hide'"
          class="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full border border-gold/30 px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-gold"
        >
          Private by choice
        </span>
      </article>
    </div>
  </section>

  <!-- ░░ Closing CTA ░░ -->
  <section class="relative overflow-hidden">
    <img
      :src="img('1465495976277-4387d4b0b4c6', 1800)"
      alt="Ceremony"
      loading="lazy"
      class="absolute inset-0 h-full w-full object-cover"
    />
    <div class="absolute inset-0 bg-ink/80"></div>
    <div class="relative mx-auto max-w-3xl px-6 py-28 text-center lg:py-36">
      <h2 class="font-display text-[clamp(2.25rem,6vw,4.5rem)] font-light leading-[1] tracking-tightest">
        Your gallery is waiting.
      </h2>
      <p class="mx-auto mt-6 max-w-md leading-relaxed text-bone-dim">
        Already worked with us? Open your private album to view, download, and share.
        New here? Let's make something worth keeping.
      </p>
      <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          class="rounded-full bg-gold px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-gold-soft"
          @click="isAuthed ? navigateTo('/studio') : goLogin()"
        >
          {{ isAuthed ? 'Enter studio' : 'Access your gallery' }}
        </button>
        <a
          href="mailto:hello@beba.photography"
          class="rounded-full border border-bone/30 px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone transition hover:border-gold hover:text-gold"
        >
          Book a session
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.reveal {
  opacity: 0;
  transform: translateY(24px);
  animation: reveal-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes reveal-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .reveal {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
