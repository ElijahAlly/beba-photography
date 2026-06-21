<script setup lang="ts">
definePageMeta({ layout: 'landing' });

useHead({ title: 'About — Beba Photography' });

const { goLogin } = useSession();

// Placeholder imagery — swap for the photographer's own portraits later.
const img = (id: string, w = 1000) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const portrait = img('1494790108377-be9c29b29330', 1200);

const facts = [
  { k: 'Based in', v: 'Washington, D.C.' },
  { k: 'Shooting since', v: '2014' },
  { k: 'Sessions', v: '600+ delivered' },
  { k: 'Speaks', v: 'English · Amharic' },
];

const values = [
  {
    n: '01',
    t: 'Heritage in every frame',
    d: 'Ethiopian American roots shape how I see colour, light, and family — warmth first, always.',
  },
  {
    n: '02',
    t: 'Patience over poses',
    d: 'The best frames arrive when no one is performing. I wait for the in-between moments.',
  },
  {
    n: '03',
    t: 'Yours to keep',
    d: 'Every session ends in a private gallery you own — download it, share it, curate it freely.',
  },
];

const strip = [
  img('1531123897727-8f129e1688ce', 700),
  img('1488161628813-04466f872be2', 700),
  img('1492288991661-058aa541ff43', 700),
  img('1504703395950-b89145a5425b', 700),
];
</script>

<template>
  <!-- ░░ Intro ░░ -->
  <section class="relative overflow-hidden pb-16 pt-32 sm:pb-24 sm:pt-40">
    <div class="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-10">
      <div>
        <p class="text-[0.7rem] uppercase tracking-[0.4em] text-gold">The photographer</p>
        <h1 class="mt-6 font-display text-[clamp(3rem,9vw,7rem)] font-light leading-[0.9] tracking-tightest">
          Hi, I'm<br /><em class="italic text-gold-soft">Beba.</em>
        </h1>
        <p class="mt-8 max-w-md text-lg leading-relaxed text-bone-dim">
          An Ethiopian American photographer making honest, unhurried images of the
          people and moments that matter most.
        </p>
        <div class="mt-10 flex flex-wrap gap-4">
          <NuxtLink
            to="/#work"
            class="rounded-full bg-bone px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-gold"
          >
            See the work
          </NuxtLink>
          <a
            href="mailto:hello@beba.photography"
            class="rounded-full border border-bone/30 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-bone transition hover:border-gold hover:text-gold"
          >
            Work with me
          </a>
        </div>
      </div>

      <div class="relative mx-auto w-full max-w-sm lg:max-w-none">
        <img
          :src="portrait"
          alt="Portrait of Beba"
          class="aspect-[4/5] w-full rounded-sm object-cover"
        />
        <div class="absolute -bottom-5 -left-4 rounded-sm border border-gold/40 bg-ink/80 px-5 py-3 backdrop-blur sm:-left-6">
          <div class="font-display text-lg tracking-tight text-bone">Beba</div>
          <div class="text-[0.65rem] uppercase tracking-[0.25em] text-gold">Photographer</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ░░ Facts bar ░░ -->
  <section class="border-y border-white/10 bg-ink-soft">
    <dl class="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-white/10 px-0 sm:grid-cols-4 sm:divide-y-0 lg:px-10">
      <div v-for="f in facts" :key="f.k" class="px-6 py-8 sm:py-10">
        <dt class="text-[0.65rem] uppercase tracking-[0.25em] text-bone-faint">{{ f.k }}</dt>
        <dd class="mt-2 font-display text-xl font-light tracking-tight text-bone sm:text-2xl">{{ f.v }}</dd>
      </div>
    </dl>
  </section>

  <!-- ░░ Story ░░ -->
  <section class="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-10">
    <div class="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
      <div>
        <p class="text-[0.7rem] uppercase tracking-[0.35em] text-gold">My story</p>
        <h2 class="mt-3 max-w-xs font-display text-4xl font-light leading-tight tracking-tightest sm:text-5xl">
          Two homes, one lens.
        </h2>
      </div>
      <div class="max-w-2xl space-y-6 text-lg leading-relaxed text-bone-dim">
        <p>
          I grew up between Addis Ababa and the D.C. suburbs, raised on big family
          dinners, louder family reunions, and the kind of golden afternoon light that
          makes everything feel a little sacred. A camera was how I learned to hold onto it.
        </p>
        <p class="text-bone-faint">
          Today I photograph weddings, families, and portraits for people who want their
          real story told — not a stiff, posed version of it. My work leans warm, candid,
          and unhurried, with an eye for the small gestures that say the most.
        </p>
        <p class="text-bone-faint">
          When the shoot is done, I hand everything off in a private gallery that's truly
          yours. View it anywhere, download the full-resolution files, share the album with
          family, and quietly hide anything you'd rather keep to yourself.
        </p>
      </div>
    </div>
  </section>

  <!-- ░░ Values ░░ -->
  <section class="border-y border-white/10 bg-ink-soft">
    <div class="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-10">
      <h2 class="max-w-xl font-display text-4xl font-light tracking-tightest sm:text-5xl">
        How I work
      </h2>
      <div class="mt-12 grid gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 sm:grid-cols-3">
        <article v-for="v in values" :key="v.n" class="bg-ink-soft p-8 transition-colors hover:bg-ink">
          <div class="font-display text-3xl font-light text-gold">{{ v.n }}</div>
          <h3 class="mt-5 font-display text-2xl font-light tracking-tight">{{ v.t }}</h3>
          <p class="mt-3 text-sm leading-relaxed text-bone-faint">{{ v.d }}</p>
        </article>
      </div>
    </div>
  </section>

  <!-- ░░ Image strip ░░ -->
  <section class="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-10">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <h2 class="font-display text-4xl font-light tracking-tightest sm:text-5xl">Behind the lens</h2>
      <p class="max-w-xs text-sm leading-relaxed text-bone-faint">
        A few frames from recent days on set — the moods, the people, the light.
      </p>
    </div>
    <div class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <img
        v-for="(src, i) in strip"
        :key="i"
        :src="src"
        alt="Behind the scenes"
        loading="lazy"
        class="aspect-[3/4] w-full rounded-sm object-cover transition duration-700 hover:opacity-90"
        :class="i % 2 === 1 ? 'translate-y-4 sm:translate-y-8' : ''"
      />
    </div>
  </section>

  <!-- ░░ CTA ░░ -->
  <section class="border-t border-white/10">
    <div class="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
      <h2 class="font-display text-[clamp(2.25rem,6vw,4.5rem)] font-light leading-[1] tracking-tightest">
        Let's make something<br /><em class="italic text-gold-soft">worth keeping.</em>
      </h2>
      <div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <a
          href="mailto:hello@beba.photography"
          class="w-full rounded-full bg-gold px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-gold-soft sm:w-auto"
        >
          Book a session
        </a>
        <button
          class="w-full rounded-full border border-bone/30 px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone transition hover:border-gold hover:text-gold sm:w-auto"
          @click="goLogin()"
        >
          Access your gallery
        </button>
      </div>
    </div>
  </section>
</template>
