<script setup lang="ts">
const api = useApi();
const { isAuthed, goLogin } = useSession();

interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  mytreesUserId?: string | null;
  createdAt: string;
}

const clients = ref<Client[]>([]);
const loading = ref(true);

onMounted(async () => {
  if (!isAuthed.value) return goLogin();
  try {
    clients.value = await api<Client[]>('/api/clients');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="space-y-6">
    <header class="flex items-end justify-between">
      <div>
        <h1 class="font-serif text-3xl tracking-tight">Clients</h1>
        <p class="text-sm text-stone-500">The people you've shot for.</p>
      </div>
      <NuxtLink
        to="/clients/new"
        class="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
      >
        + New client
      </NuxtLink>
    </header>

    <div v-if="loading" class="rounded-xl border border-stone-200 bg-white py-16 text-center text-sm text-stone-400">
      Loading…
    </div>
    <div v-else-if="clients.length === 0" class="rounded-xl border border-dashed border-stone-300 bg-white py-16 text-center text-sm text-stone-500">
      No clients yet — <NuxtLink to="/clients/new" class="font-medium text-rose-600 hover:underline">add your first</NuxtLink>.
    </div>
    <ul v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="c in clients" :key="c.id">
        <NuxtLink
          :to="`/clients/${c.id}`"
          class="block h-full rounded-xl border border-stone-200 bg-white p-4 transition hover:border-stone-300 hover:shadow-md"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="truncate text-base font-semibold">{{ c.name }}</div>
              <div class="truncate text-xs text-stone-500">{{ c.email }}</div>
              <div v-if="c.phone" class="mt-1 text-xs text-stone-500">{{ c.phone }}</div>
            </div>
            <span
              v-if="c.mytreesUserId"
              class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"
              title="This client has a mytrees.family account — they can sign in to see their galleries."
            >
              linked
            </span>
            <span
              v-else
              class="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500"
              title="Client hasn't signed in to mytrees.family with this email yet."
            >
              pending
            </span>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
