<script setup lang="ts">
const api = useApi();
const router = useRouter();
const route = useRoute();
const { push } = useToast();
const { isAuthed, goLogin } = useSession();

interface Client { id: number; name: string; email: string }

const clients = ref<Client[]>([]);
const loadingClients = ref(true);
const submitting = ref(false);

const { packages, load: loadPricing, fmt, unitLabel } = usePricing();

const form = reactive({
  clientId: 0,
  title: '',
  scheduledFor: '',
  location: '',
  totalPrice: '' as string,
  pricePackageId: '' as string,
  notes: '',
});

// Prefill the price from an advertised package. The amount stays fully editable
// afterwards (travel, rescheduling, friends-and-family, etc.).
const pickPackage = (id: string, priceCents: number) => {
  form.pricePackageId = id;
  form.totalPrice = (priceCents / 100).toFixed(2);
};

// Allow preselecting a client via ?clientId= so the "+ New shoot" button on
// a client detail page can deep-link the dropdown.
const preselectId = Number(route.query.clientId);

onMounted(async () => {
  if (!isAuthed.value) return goLogin();
  loadPricing();
  try {
    clients.value = await api<Client[]>('/api/clients');
    if (preselectId && clients.value.some((c) => c.id === preselectId)) {
      form.clientId = preselectId;
    } else if (clients.value.length === 1) {
      form.clientId = clients.value[0]!.id;
    }
  } finally {
    loadingClients.value = false;
  }
});

const submit = async () => {
  if (!form.clientId) {
    push('Pick a client first', 'error');
    return;
  }
  submitting.value = true;
  try {
    const cents = form.totalPrice
      ? Math.round(parseFloat(form.totalPrice) * 100)
      : 0;
    const created = await api<{ id: number }>('/api/shoots', {
      method: 'POST',
      body: {
        clientId: form.clientId,
        title: form.title.trim(),
        scheduledFor: form.scheduledFor || undefined,
        location: form.location || undefined,
        totalPriceCents: cents || undefined,
        pricePackageId: form.pricePackageId || undefined,
        notes: form.notes || undefined,
      },
    });
    push('Shoot created', 'success');
    router.replace(`/shoots/${created.id}`);
  } catch (e: any) {
    push(e?.data?.message || e?.message || 'Failed to create shoot', 'error');
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="mx-auto max-w-xl space-y-6">
    <header>
      <NuxtLink to="/shoots" class="text-xs text-stone-500 hover:underline">← Shoots</NuxtLink>
      <h1 class="mt-1 font-serif text-3xl tracking-tight">New shoot</h1>
      <p class="text-sm text-stone-500">Book a session — you can add media once it's saved.</p>
    </header>

    <form class="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm" @submit.prevent="submit">
      <div>
        <label class="block text-xs font-medium text-stone-700">Client</label>
        <div v-if="loadingClients" class="mt-1 text-sm text-stone-400">Loading clients…</div>
        <div v-else-if="clients.length === 0" class="mt-1 text-sm text-stone-500">
          No clients yet — <NuxtLink to="/clients/new" class="text-rose-600 hover:underline">create one</NuxtLink> first.
        </div>
        <select
          v-else
          v-model.number="form.clientId"
          class="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          required
        >
          <option :value="0" disabled>Pick a client…</option>
          <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }} — {{ c.email }}</option>
        </select>
      </div>

      <div v-if="packages.length">
        <label class="block text-xs font-medium text-stone-700">Package <span class="font-normal text-stone-400">(optional — prefills the price)</span></label>
        <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button
            v-for="p in packages"
            :key="p.id"
            type="button"
            class="rounded-lg border px-3 py-2.5 text-left transition"
            :class="
              form.pricePackageId === p.id
                ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-500'
                : 'border-stone-300 bg-white hover:border-stone-400'
            "
            @click="pickPackage(p.id, p.priceCents)"
          >
            <div class="truncate text-xs font-semibold text-stone-800">{{ p.name }}</div>
            <div class="mt-0.5 text-xs text-stone-500">
              <span v-if="p.startingAt">from </span>{{ fmt(p.priceCents) }}<span v-if="unitLabel(p.unit)"> {{ unitLabel(p.unit) }}</span>
            </div>
          </button>
        </div>
        <p class="mt-2 text-xs text-stone-400">
          Baselines from your <NuxtLink to="/pricing" class="text-rose-600 hover:underline">pricing</NuxtLink>. You can override the amount below for travel, rescheduling, or special requests.
        </p>
      </div>

      <div>
        <label class="block text-xs font-medium text-stone-700">Title</label>
        <input
          v-model="form.title"
          type="text"
          required
          maxlength="120"
          placeholder="e.g. Engagement session in the orchard"
          class="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
        />
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="block text-xs font-medium text-stone-700">Scheduled for</label>
          <input
            v-model="form.scheduledFor"
            type="datetime-local"
            class="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-stone-700">Total price (USD)</label>
          <input
            v-model="form.totalPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            class="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-stone-700">Location</label>
        <input
          v-model="form.location"
          type="text"
          maxlength="200"
          placeholder="Where is the shoot?"
          class="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-stone-700">Notes</label>
        <textarea
          v-model="form.notes"
          rows="3"
          maxlength="2000"
          placeholder="Anything the team should know"
          class="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
        />
      </div>

      <div class="flex items-center justify-end gap-3">
        <NuxtLink to="/shoots" class="text-sm text-stone-500 hover:underline">Cancel</NuxtLink>
        <button
          type="submit"
          :disabled="submitting || !form.clientId"
          class="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
        >
          {{ submitting ? 'Saving…' : 'Create shoot' }}
        </button>
      </div>
    </form>
  </div>
</template>
