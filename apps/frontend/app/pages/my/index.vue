<script setup lang="ts">
const api = useApi();
const { isAuthed, goLogin } = useSession();

interface ShootRow {
  id: number;
  title: string;
  status: string;
  scheduledFor?: string | null;
  location?: string | null;
  paidAt?: string | null;
  totalPriceCents: number;
  photographerStudio?: string | null;
  photographerEmail?: string | null;
}

const shoots = ref<ShootRow[]>([]);
const loading = ref(true);

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const statusStyle = (status: string) => ({
  booked: 'bg-stone-100 text-stone-700',
  in_progress: 'bg-amber-100 text-amber-800',
  delivered: 'bg-blue-100 text-blue-800',
  paid: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-stone-100 text-stone-400',
})[status] || 'bg-stone-100 text-stone-700';

onMounted(async () => {
  if (!isAuthed.value) return goLogin();
  try {
    shoots.value = await api<ShootRow[]>('/api/my/shoots');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="font-serif text-3xl tracking-tight">Your galleries</h1>
      <p class="text-sm text-stone-500">Shoots where you're the client — preview, download, and keep them when payment clears.</p>
    </header>

    <div v-if="loading" class="rounded-xl border border-stone-200 bg-white py-16 text-center text-sm text-stone-400">
      Loading…
    </div>
    <div v-else-if="shoots.length === 0" class="rounded-xl border border-dashed border-stone-300 bg-white py-16 text-center text-sm text-stone-500">
      You don't have any galleries yet. When a photographer adds you as a client and uploads media, it'll show up here.
    </div>
    <ul v-else class="grid gap-4 sm:grid-cols-2">
      <li v-for="s in shoots" :key="s.id">
        <NuxtLink
          :to="`/shoots/${s.id}`"
          class="block h-full rounded-xl border border-stone-200 bg-white p-5 transition hover:border-stone-300 hover:shadow-md"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="truncate text-lg font-semibold">{{ s.title }}</div>
              <div class="mt-0.5 text-xs text-stone-500">
                {{ s.photographerStudio || 'Photographer' }}
              </div>
            </div>
            <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" :class="statusStyle(s.status)">{{ s.status }}</span>
          </div>
          <div class="mt-4 flex items-center justify-between text-xs text-stone-500">
            <span>{{ fmtDate(s.scheduledFor) }}</span>
            <span v-if="s.location">📍 {{ s.location }}</span>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
