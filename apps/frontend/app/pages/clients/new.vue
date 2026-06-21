<script setup lang="ts">
const api = useApi();
const router = useRouter();
const { push } = useToast();
const { isAuthed, goLogin } = useSession();

const form = reactive({
  name: '',
  email: '',
  phone: '',
  notes: '',
});
const submitting = ref(false);

onMounted(() => { if (!isAuthed.value) goLogin(); });

const submit = async () => {
  submitting.value = true;
  try {
    const created = await api<{ id: number }>('/api/clients', {
      method: 'POST',
      body: {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone || undefined,
        notes: form.notes || undefined,
      },
    });
    push('Client added', 'success');
    router.replace(`/clients/${created.id}`);
  } catch (e: any) {
    push(e?.data?.message || e?.message || 'Failed to add client', 'error');
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="mx-auto max-w-xl space-y-6">
    <header>
      <NuxtLink to="/clients" class="text-xs text-stone-500 hover:underline">← Clients</NuxtLink>
      <h1 class="mt-1 font-serif text-3xl tracking-tight">New client</h1>
      <p class="text-sm text-stone-500">
        If they already have a mytrees.family account, we'll link it automatically by email.
      </p>
    </header>

    <form class="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm" @submit.prevent="submit">
      <div>
        <label class="block text-xs font-medium text-stone-700">Name</label>
        <input
          v-model="form.name"
          type="text"
          required
          maxlength="200"
          class="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-stone-700">Email</label>
        <input
          v-model="form.email"
          type="email"
          required
          class="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-stone-700">Phone (optional)</label>
        <input
          v-model="form.phone"
          type="tel"
          maxlength="50"
          class="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-stone-700">Notes</label>
        <textarea
          v-model="form.notes"
          rows="3"
          maxlength="2000"
          class="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
        />
      </div>

      <div class="flex items-center justify-end gap-3">
        <NuxtLink to="/clients" class="text-sm text-stone-500 hover:underline">Cancel</NuxtLink>
        <button
          type="submit"
          :disabled="submitting"
          class="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
        >
          {{ submitting ? 'Saving…' : 'Add client' }}
        </button>
      </div>
    </form>
  </div>
</template>
