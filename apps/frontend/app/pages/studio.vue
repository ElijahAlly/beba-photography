<script setup lang="ts">
const { isAuthed, user, goLogin } = useSession();
const api = useApi();

interface ShootRow {
  id: number;
  title: string;
  status: string;
  scheduledFor?: string | null;
  location?: string | null;
  paidAt?: string | null;
  clientName?: string | null;
  photographerStudio?: string | null;
}

interface ClientRow {
  id: number;
  name: string;
  email: string;
}

const studioShoots = ref<ShootRow[]>([]);
const myShoots = ref<ShootRow[]>([]);
const clientCount = ref(0);
const loading = ref(true);

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const statusStyle = (status: string) => ({
  booked: 'bg-stone-100 text-stone-700',
  in_progress: 'bg-amber-100 text-amber-800',
  delivered: 'bg-blue-100 text-blue-800',
  paid: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-stone-100 text-stone-400 line-through',
})[status] || 'bg-stone-100 text-stone-700';

watchEffect(async () => {
  if (!isAuthed.value) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const [s, m, cs] = await Promise.all([
      api<ShootRow[]>('/api/shoots'),
      api<ShootRow[]>('/api/my/shoots'),
      api<ClientRow[]>('/api/clients'),
    ]);
    studioShoots.value = s;
    myShoots.value = m;
    clientCount.value = cs.length;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div v-if="!isAuthed" class="mx-auto max-w-2xl pt-16 text-center">
    <h1 class="font-serif text-4xl tracking-tight">Studio sign in</h1>
    <p class="mt-3 text-stone-500">
      Sign in with your mytrees.family account to manage shoots, deliver galleries, and hand off files when payment clears.
    </p>
    <button
      class="mt-8 rounded-md bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
      @click="goLogin()"
    >
      Sign in with mytrees.family
    </button>
  </div>

  <div v-else class="space-y-10">
    <header class="flex flex-col gap-1">
      <h1 class="font-serif text-3xl tracking-tight">
        Welcome back, {{ user?.displayName || user?.email?.split('@')[0] }}
      </h1>
      <p class="text-sm text-stone-500">Here's what's going on with your studio.</p>
    </header>

    <section class="grid gap-4 sm:grid-cols-3">
      <NuxtLink
        to="/shoots"
        class="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:shadow-md"
      >
        <div class="text-xs uppercase tracking-wide text-stone-400">Shoots</div>
        <div class="mt-2 text-3xl font-semibold">{{ studioShoots.length }}</div>
        <div class="mt-3 text-xs text-rose-600 group-hover:underline">Manage shoots →</div>
      </NuxtLink>
      <NuxtLink
        to="/clients"
        class="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:shadow-md"
      >
        <div class="text-xs uppercase tracking-wide text-stone-400">Clients</div>
        <div class="mt-2 text-3xl font-semibold">{{ clientCount }}</div>
        <div class="mt-3 text-xs text-rose-600 group-hover:underline">Manage clients →</div>
      </NuxtLink>
      <NuxtLink
        to="/shoots/new"
        class="group flex flex-col justify-between rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5 text-stone-700 transition hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700"
      >
        <div class="text-xs uppercase tracking-wide text-stone-400">Get started</div>
        <div class="mt-2 text-lg font-semibold">+ New shoot</div>
        <div class="mt-3 text-xs">Book a session →</div>
      </NuxtLink>
    </section>

    <section>
      <div class="mb-3 flex items-end justify-between">
        <div>
          <h2 class="text-lg font-semibold">Recent shoots</h2>
          <p class="text-xs text-stone-500">Shoots you're photographing.</p>
        </div>
        <NuxtLink to="/shoots" class="text-xs text-rose-600 hover:underline">View all</NuxtLink>
      </div>

      <div v-if="loading" class="rounded-xl border border-stone-200 bg-white py-12 text-center text-sm text-stone-400">
        Loading…
      </div>
      <div v-else-if="studioShoots.length === 0" class="rounded-xl border border-dashed border-stone-300 bg-white py-12 text-center text-sm text-stone-500">
        No shoots yet.
        <NuxtLink to="/shoots/new" class="font-medium text-rose-600 hover:underline">Create your first.</NuxtLink>
      </div>
      <ul v-else class="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white">
        <li v-for="s in studioShoots.slice(0, 5)" :key="s.id">
          <NuxtLink
            :to="`/shoots/${s.id}`"
            class="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-stone-50"
          >
            <div class="min-w-0">
              <div class="truncate font-medium">{{ s.title }}</div>
              <div class="text-xs text-stone-500">
                {{ s.clientName || '—' }} · {{ fmtDate(s.scheduledFor) }}
              </div>
            </div>
            <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" :class="statusStyle(s.status)">{{ s.status }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section v-if="myShoots.length > 0">
      <div class="mb-3 flex items-end justify-between">
        <div>
          <h2 class="text-lg font-semibold">Your galleries</h2>
          <p class="text-xs text-stone-500">Shoots where you're the client.</p>
        </div>
        <NuxtLink to="/my" class="text-xs text-rose-600 hover:underline">View all</NuxtLink>
      </div>
      <ul class="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white">
        <li v-for="s in myShoots.slice(0, 5)" :key="s.id">
          <NuxtLink
            :to="`/shoots/${s.id}`"
            class="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-stone-50"
          >
            <div class="min-w-0">
              <div class="truncate font-medium">{{ s.title }}</div>
              <div class="text-xs text-stone-500">{{ s.photographerStudio || 'Photographer' }} · {{ fmtDate(s.scheduledFor) }}</div>
            </div>
            <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" :class="statusStyle(s.status)">{{ s.status }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
