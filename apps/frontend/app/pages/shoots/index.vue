<script setup lang="ts">
const api = useApi();
const { isAuthed, goLogin } = useSession();

interface ShootRow {
  id: number;
  title: string;
  status: string;
  scheduledFor?: string | null;
  location?: string | null;
  totalPriceCents?: number;
  paidAt?: string | null;
  clientName?: string | null;
}

const shoots = ref<ShootRow[]>([]);
const loading = ref(true);

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtMoney = (cents?: number) =>
  cents ? `$${(cents / 100).toFixed(2)}` : '—';
const statusStyle = (status: string) => ({
  booked: 'bg-stone-100 text-stone-700',
  in_progress: 'bg-amber-100 text-amber-800',
  delivered: 'bg-blue-100 text-blue-800',
  paid: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-stone-100 text-stone-400 line-through',
})[status] || 'bg-stone-100 text-stone-700';

onMounted(async () => {
  if (!isAuthed.value) return goLogin();
  try { shoots.value = await api<ShootRow[]>('/api/shoots'); }
  finally { loading.value = false; }
});
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="font-serif text-3xl tracking-tight">Shoots</h1>
        <p class="text-sm text-stone-500">Every session you've booked, in flight, or delivered.</p>
      </div>
      <NuxtLink
        to="/shoots/new"
        class="shrink-0 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
      >
        + New shoot
      </NuxtLink>
    </header>

    <div v-if="loading" class="rounded-xl border border-stone-200 bg-white py-16 text-center text-sm text-stone-400">
      Loading…
    </div>
    <div v-else-if="shoots.length === 0" class="rounded-xl border border-dashed border-stone-300 bg-white py-16 text-center text-sm text-stone-500">
      No shoots yet — <NuxtLink to="/shoots/new" class="font-medium text-rose-600 hover:underline">book the first one</NuxtLink>.
    </div>
    <template v-else>
      <!-- Mobile: stacked cards -->
      <ul class="space-y-3 sm:hidden">
        <li v-for="s in shoots" :key="s.id">
          <NuxtLink
            :to="`/shoots/${s.id}`"
            class="block rounded-xl border border-stone-200 bg-white p-4 transition hover:border-stone-300 hover:shadow-md"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="truncate font-medium">{{ s.title }}</div>
                <div class="mt-0.5 truncate text-xs text-stone-500">{{ s.clientName || '—' }}</div>
              </div>
              <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" :class="statusStyle(s.status)">{{ s.status }}</span>
            </div>
            <div class="mt-3 flex items-center justify-between text-xs text-stone-500">
              <span>{{ fmtDate(s.scheduledFor) }}</span>
              <span>{{ fmtMoney(s.totalPriceCents) }}</span>
            </div>
          </NuxtLink>
        </li>
      </ul>

      <!-- Larger screens: table -->
      <div class="hidden overflow-x-auto rounded-xl border border-stone-200 bg-white sm:block">
        <table class="w-full text-sm">
          <thead class="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th class="px-4 py-2">Title</th>
              <th class="px-4 py-2">Client</th>
              <th class="px-4 py-2">Scheduled</th>
              <th class="px-4 py-2">Price</th>
              <th class="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr
              v-for="s in shoots"
              :key="s.id"
              class="cursor-pointer hover:bg-stone-50"
              @click="$router.push(`/shoots/${s.id}`)"
            >
              <td class="px-4 py-3 font-medium">{{ s.title }}</td>
              <td class="px-4 py-3 text-stone-600">{{ s.clientName || '—' }}</td>
              <td class="px-4 py-3 text-stone-600">{{ fmtDate(s.scheduledFor) }}</td>
              <td class="px-4 py-3 text-stone-600">{{ fmtMoney(s.totalPriceCents) }}</td>
              <td class="px-4 py-3"><span class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" :class="statusStyle(s.status)">{{ s.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
