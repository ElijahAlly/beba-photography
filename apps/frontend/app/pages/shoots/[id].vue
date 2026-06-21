<script setup lang="ts">
const api = useApi();
const route = useRoute();
const router = useRouter();
const { push } = useToast();
const { isAuthed, goLogin } = useSession();

const shootId = computed(() => Number(route.params.id));

interface Shoot {
  id: number;
  title: string;
  status: string;
  scheduledFor?: string | null;
  location?: string | null;
  totalPriceCents: number;
  pricePackageId?: string | null;
  paidAt?: string | null;
  paymentMethod?: 'stripe' | 'cash' | 'waived' | null;
  amountPaidCents?: number;
  notes?: string | null;
  clientId: number;
  clientName?: string | null;
  clientEmail?: string | null;
  clientUserId?: string | null;
  photographerStudio?: string | null;
  viewerRole: 'photographer' | 'client';
}

interface Media {
  id: number;
  shootId: number;
  filename: string;
  type: string;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  transferredAt?: string | null;
}

const shoot = ref<Shoot | null>(null);
const media = ref<Media[]>([]);
const loading = ref(true);
const lightboxIndex = ref<number | null>(null);
const paying = ref(false);
const checkingOut = ref(false);

const paymentMethodLabel: Record<string, string> = {
  stripe: 'Paid online',
  cash: 'Paid by cash',
  waived: 'Fee waived',
};

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const fmtMoney = (cents?: number) =>
  cents ? `$${(cents / 100).toFixed(2)}` : '$0.00';
const statusStyle = (status: string) => ({
  booked: 'bg-stone-100 text-stone-700',
  in_progress: 'bg-amber-100 text-amber-800',
  delivered: 'bg-blue-100 text-blue-800',
  paid: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-stone-100 text-stone-400',
})[status] || 'bg-stone-100 text-stone-700';

const isPhotographer = computed(() => shoot.value?.viewerRole === 'photographer');
const canCollect = computed(
  () => isPhotographer.value && shoot.value?.status !== 'paid' && shoot.value?.status !== 'cancelled',
);

const load = async () => {
  loading.value = true;
  try {
    const [s, m] = await Promise.all([
      api<Shoot>(`/api/shoots/${shootId.value}`),
      api<Media[]>(`/api/shoots/${shootId.value}/media`),
    ]);
    shoot.value = s;
    media.value = m;
  } catch (e: any) {
    if (e?.status === 401) goLogin();
    else if (e?.status === 404) router.replace('/shoots');
    else push(e?.data?.message || 'Failed to load shoot', 'error');
  } finally {
    loading.value = false;
  }
};

const onUploaded = async () => {
  // Refresh just the media list; the shoot itself didn't change.
  try {
    media.value = await api<Media[]>(`/api/shoots/${shootId.value}/media`);
  } catch { /* uploader already toasted */ }
};

// Manual settlement: cash or a waiver. Both flip the shoot to paid and
// transfer file ownership to the client.
const recordPayment = async (method: 'cash' | 'waived') => {
  const msg =
    method === 'waived'
      ? 'Waive this fee and mark the shoot complete? Ownership of every file transfers to the client.'
      : 'Record a cash payment? This marks the shoot paid and transfers every file to the client.';
  if (!confirm(msg)) return;
  paying.value = true;
  try {
    const res = await api<{ transferred: number; pendingClientLink: boolean; failures: any[] }>(
      `/api/shoots/${shootId.value}/mark-paid`,
      { method: 'POST', body: { method } },
    );
    const verb = method === 'waived' ? 'Fee waived' : 'Cash recorded';
    if (res.pendingClientLink) {
      push(`${verb}. Client hasn't signed in yet — transfer runs when they do.`, 'info');
    } else if (res.failures.length > 0) {
      push(`${verb}. ${res.transferred} transferred, ${res.failures.length} failed.`, 'error');
    } else {
      push(`${verb}. ${res.transferred} files transferred to the client.`, 'success');
    }
    await load();
  } catch (e: any) {
    push(e?.data?.message || 'Could not record payment', 'error');
  } finally {
    paying.value = false;
  }
};

// Online payment: hand off to Stripe Checkout. The shoot is marked paid later
// by the webhook, so we reload on return (?paid=1).
const collectOnline = async () => {
  checkingOut.value = true;
  try {
    const res = await api<{ url: string }>(`/api/shoots/${shootId.value}/checkout`, {
      method: 'POST',
    });
    window.location.href = res.url;
  } catch (e: any) {
    push(e?.data?.message || 'Could not start online payment', 'error');
    checkingOut.value = false;
  }
};

onMounted(() => {
  if (!isAuthed.value) return goLogin();
  if (route.query.paid) {
    push('Payment received — finalizing your gallery.', 'success');
    router.replace({ query: {} });
  } else if (route.query.canceled) {
    push('Online payment canceled.', 'info');
    router.replace({ query: {} });
  }
  load();
});
</script>

<template>
  <div v-if="loading" class="rounded-xl border border-stone-200 bg-white py-16 text-center text-sm text-stone-400">
    Loading…
  </div>

  <div v-else-if="shoot" class="space-y-8">
    <!-- Header -->
    <header class="space-y-3">
      <NuxtLink
        :to="isPhotographer ? '/shoots' : '/my'"
        class="text-xs text-stone-500 hover:underline"
      >
        ← {{ isPhotographer ? 'Shoots' : 'My galleries' }}
      </NuxtLink>

      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h1 class="font-serif text-3xl tracking-tight">{{ shoot.title }}</h1>
            <span
              class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="statusStyle(shoot.status)"
            >
              {{ shoot.status }}
            </span>
          </div>
          <p class="mt-1 text-sm text-stone-500">
            {{ isPhotographer
              ? `For ${shoot.clientName} · ${shoot.clientEmail}`
              : `By ${shoot.photographerStudio || 'your photographer'}` }}
          </p>
        </div>

        <div v-if="isPhotographer" class="flex flex-wrap items-center gap-2">
          <NuxtLink
            :to="`/clients/${shoot.clientId}`"
            class="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
          >
            View client
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Meta grid -->
    <section class="grid gap-4 sm:grid-cols-4">
      <div class="rounded-xl border border-stone-200 bg-white p-4">
        <div class="text-[10px] uppercase tracking-wide text-stone-400">Scheduled</div>
        <div class="mt-1 text-sm font-medium">{{ fmtDate(shoot.scheduledFor) }}</div>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4">
        <div class="text-[10px] uppercase tracking-wide text-stone-400">Location</div>
        <div class="mt-1 text-sm font-medium">{{ shoot.location || '—' }}</div>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4">
        <div class="text-[10px] uppercase tracking-wide text-stone-400">Price</div>
        <div class="mt-1 text-sm font-medium">{{ fmtMoney(shoot.totalPriceCents) }}</div>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4">
        <div class="text-[10px] uppercase tracking-wide text-stone-400">Paid</div>
        <div class="mt-1 text-sm font-medium">{{ fmtDate(shoot.paidAt) }}</div>
      </div>
    </section>

    <!-- Payment (photographer only) -->
    <section v-if="isPhotographer" class="rounded-xl border border-stone-200 bg-white p-5">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold">Payment</h2>
          <p class="mt-0.5 text-sm text-stone-500">
            <template v-if="shoot.status === 'paid'">
              {{ paymentMethodLabel[shoot.paymentMethod || ''] || 'Paid' }}
              · {{ fmtMoney(shoot.amountPaidCents) }}
              <span v-if="shoot.paidAt" class="text-stone-400">on {{ fmtDate(shoot.paidAt) }}</span>
            </template>
            <template v-else-if="shoot.status === 'cancelled'">This shoot was cancelled.</template>
            <template v-else>
              Due: <span class="font-medium text-stone-700">{{ fmtMoney(shoot.totalPriceCents) }}</span>
              — collect online, record cash, or waive the fee.
            </template>
          </p>
        </div>
        <span
          class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
          :class="shoot.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'"
        >
          {{ shoot.status === 'paid' ? '✓ Settled' : 'Unpaid' }}
        </span>
      </div>

      <div v-if="canCollect" class="mt-4 flex flex-wrap gap-2">
        <button
          :disabled="checkingOut || paying"
          class="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          @click="collectOnline"
        >
          {{ checkingOut ? 'Starting…' : 'Collect online (card)' }}
        </button>
        <button
          :disabled="paying || checkingOut"
          class="rounded-md border border-emerald-600 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
          @click="recordPayment('cash')"
        >
          {{ paying ? 'Saving…' : 'Record cash' }}
        </button>
        <button
          :disabled="paying || checkingOut"
          class="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50"
          @click="recordPayment('waived')"
        >
          Waive fee
        </button>
      </div>
      <p v-if="canCollect" class="mt-2 text-xs text-stone-400">
        Online card payments require Stripe to be configured. Cash and waivers always work.
      </p>
    </section>

    <!-- Notes (only for photographer) -->
    <section v-if="isPhotographer && shoot.notes" class="rounded-xl border border-stone-200 bg-white p-4">
      <div class="text-[10px] uppercase tracking-wide text-stone-400">Notes</div>
      <p class="mt-1 whitespace-pre-wrap text-sm">{{ shoot.notes }}</p>
    </section>

    <!-- Uploader (photographer only) -->
    <section v-if="isPhotographer">
      <h2 class="mb-3 text-lg font-semibold">Add media</h2>
      <MediaUploader :shoot-id="shootId" @uploaded="onUploaded" />
    </section>

    <!-- Gallery -->
    <section>
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-lg font-semibold">
          Gallery
          <span class="ml-2 text-sm font-normal text-stone-500">{{ media.length }} item{{ media.length === 1 ? '' : 's' }}</span>
        </h2>
        <div v-if="!isPhotographer && shoot.status !== 'paid'" class="text-xs text-stone-500">
          Preview only — files will be yours to keep once your photographer marks the shoot as paid.
        </div>
        <div v-else-if="!isPhotographer && shoot.status === 'paid'" class="text-xs text-emerald-700">
          ✓ Paid — these files are yours.
        </div>
      </div>

      <MediaGrid :shoot-id="shootId" :items="media" @open="(i) => (lightboxIndex = i)" />
    </section>

    <MediaLightbox v-model="lightboxIndex" :items="media" />
  </div>
</template>
