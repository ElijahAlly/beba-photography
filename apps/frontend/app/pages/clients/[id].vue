<script setup lang="ts">
const api = useApi();
const route = useRoute();
const router = useRouter();
const { push } = useToast();
const { isAuthed, goLogin } = useSession();

const clientId = computed(() => Number(route.params.id));

interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
  mytreesUserId?: string | null;
  createdAt: string;
}
interface Shoot {
  id: number;
  title: string;
  status: string;
  scheduledFor?: string | null;
  totalPriceCents: number;
  paidAt?: string | null;
}

const client = ref<Client | null>(null);
const shoots = ref<Shoot[]>([]);
const loading = ref(true);

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;
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
    const [c, s] = await Promise.all([
      api<Client>(`/api/clients/${clientId.value}`),
      api<Shoot[]>(`/api/clients/${clientId.value}/shoots`),
    ]);
    client.value = c;
    shoots.value = s;
  } catch (e: any) {
    if (e?.status === 404) router.replace('/clients');
    else push(e?.data?.message || 'Failed to load client', 'error');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div v-if="loading" class="rounded-xl border border-stone-200 bg-white py-16 text-center text-sm text-stone-400">
    Loading…
  </div>

  <div v-else-if="client" class="space-y-8">
    <header class="space-y-2">
      <NuxtLink to="/clients" class="text-xs text-stone-500 hover:underline">← Clients</NuxtLink>
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="font-serif text-3xl tracking-tight">{{ client.name }}</h1>
          <p class="text-sm text-stone-500">{{ client.email }}</p>
          <p v-if="client.phone" class="text-sm text-stone-500">{{ client.phone }}</p>
        </div>
        <div class="flex items-center gap-2">
          <span
            v-if="client.mytreesUserId"
            class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
            title="This client can sign in to mytrees.family to see their shoots."
          >
            linked to mytrees.family
          </span>
          <span
            v-else
            class="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500"
            title="Will link automatically the next time they sign in with this email."
          >
            no account yet
          </span>
          <NuxtLink
            :to="`/shoots/new?clientId=${client.id}`"
            class="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
          >
            + New shoot
          </NuxtLink>
        </div>
      </div>
    </header>

    <section v-if="client.notes" class="rounded-xl border border-stone-200 bg-white p-4">
      <div class="text-[10px] uppercase tracking-wide text-stone-400">Notes</div>
      <p class="mt-1 whitespace-pre-wrap text-sm">{{ client.notes }}</p>
    </section>

    <section>
      <h2 class="mb-3 text-lg font-semibold">Shoots</h2>
      <div v-if="shoots.length === 0" class="rounded-xl border border-dashed border-stone-300 bg-white py-12 text-center text-sm text-stone-500">
        No shoots for this client yet.
      </div>
      <ul v-else class="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white">
        <li v-for="s in shoots" :key="s.id">
          <NuxtLink
            :to="`/shoots/${s.id}`"
            class="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-stone-50"
          >
            <div class="min-w-0">
              <div class="truncate font-medium">{{ s.title }}</div>
              <div class="text-xs text-stone-500">{{ fmtDate(s.scheduledFor) }} · {{ fmtMoney(s.totalPriceCents) }}</div>
            </div>
            <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" :class="statusStyle(s.status)">{{ s.status }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
