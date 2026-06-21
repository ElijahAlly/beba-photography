<script setup lang="ts">
definePageMeta({ layout: 'landing' });
useHead({ title: 'Pricing — Beba Photography' });

const { goLogin } = useSession();
const { packages, loading, load, fmt, unitLabel } = usePricing();

await load();
</script>

<template>
  <!-- ░░ Intro ░░ -->
  <section class="mx-auto max-w-7xl px-6 pb-12 pt-32 sm:pt-40 lg:px-10">
    <p class="text-[0.7rem] uppercase tracking-[0.4em] text-gold">Investment</p>
    <h1 class="mt-6 max-w-3xl font-display text-[clamp(2.75rem,8vw,6rem)] font-light leading-[0.95] tracking-tightest">
      Simple, honest <em class="italic text-gold-soft">pricing.</em>
    </h1>
    <p class="mt-8 max-w-xl text-lg leading-relaxed text-bone-dim">
      Clear starting points for every kind of session. The final quote can shift a
      little for travel, location, timing, and special requests — you'll always know
      the number before we shoot.
    </p>
  </section>

  <!-- ░░ Packages ░░ -->
  <section class="mx-auto max-w-7xl px-6 pb-12 lg:px-10">
    <div v-if="loading" class="py-20 text-center text-sm uppercase tracking-[0.2em] text-bone-faint">
      Loading pricing…
    </div>
    <div
      v-else-if="packages.length === 0"
      class="rounded-sm border border-white/10 bg-ink-soft py-20 text-center text-sm text-bone-faint"
    >
      Pricing is being updated — please check back soon.
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="p in packages"
        :key="p.id"
        class="group relative flex flex-col rounded-sm border p-7 transition-colors duration-300"
        :class="
          p.featured
            ? 'border-gold/60 bg-gradient-to-b from-gold/[0.08] to-transparent'
            : 'border-white/10 bg-ink-soft hover:border-white/20'
        "
      >
        <span
          v-if="p.featured"
          class="absolute right-5 top-5 rounded-full border border-gold/40 px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-gold"
        >
          Most loved
        </span>

        <h2 class="font-display text-2xl font-light tracking-tight">{{ p.name }}</h2>

        <div class="mt-5 flex items-baseline gap-1.5">
          <span v-if="p.startingAt" class="text-xs uppercase tracking-[0.2em] text-bone-faint">from</span>
          <span class="font-display text-5xl font-light tracking-tightest text-bone">{{ fmt(p.priceCents) }}</span>
          <span v-if="unitLabel(p.unit)" class="text-sm text-bone-faint">{{ unitLabel(p.unit) }}</span>
        </div>

        <p class="mt-5 flex-1 text-sm leading-relaxed text-bone-faint">{{ p.description }}</p>

        <button
          class="mt-8 w-full rounded-full border border-bone/25 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-bone transition group-hover:border-gold group-hover:text-gold"
          @click="goLogin()"
        >
          Enquire
        </button>
      </article>
    </div>
  </section>

  <!-- ░░ Fine print ░░ -->
  <section class="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
    <div class="rounded-sm border border-white/10 bg-ink-soft p-8 sm:p-10">
      <h3 class="font-display text-xl font-light tracking-tight text-bone">What can change the price?</h3>
      <ul class="mt-5 grid gap-x-10 gap-y-3 text-sm leading-relaxed text-bone-faint sm:grid-cols-2">
        <li>· Travel time and distance to the location</li>
        <li>· Hard-to-reach or permit-required venues</li>
        <li>· Rescheduling and last-minute changes</li>
        <li>· Additional photographers or assistants</li>
        <li>· Unique requests, props, or extended editing</li>
        <li>· Friends-and-family rates, at the photographer's discretion</li>
      </ul>
    </div>
  </section>

  <!-- ░░ CTA ░░ -->
  <section class="border-t border-white/10">
    <div class="mx-auto max-w-3xl px-6 py-24 text-center sm:py-28">
      <h2 class="font-display text-[clamp(2rem,5vw,3.5rem)] font-light leading-[1.05] tracking-tightest">
        Have something specific in mind?
      </h2>
      <p class="mx-auto mt-5 max-w-md leading-relaxed text-bone-dim">
        Tell me about your shoot and I'll put together a quote that fits.
      </p>
      <div class="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <a
          href="mailto:hello@beba.photography"
          class="w-full rounded-full bg-gold px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-gold-soft sm:w-auto"
        >
          Request a quote
        </a>
        <NuxtLink
          to="/#work"
          class="w-full rounded-full border border-bone/30 px-8 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-bone transition hover:border-gold hover:text-gold sm:w-auto"
        >
          See the work
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
