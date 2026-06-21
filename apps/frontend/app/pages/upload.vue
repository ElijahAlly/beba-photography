<script setup lang="ts">
const config = useRuntimeConfig();

const shootId = ref(1);
const file = ref<File | null>(null);
const uploading = ref(false);
const result = ref<any>(null);
const error = ref<string | null>(null);

const onFile = (e: Event) => {
  const target = e.target as HTMLInputElement;
  file.value = target.files?.[0] || null;
};

const upload = async () => {
  if (!file.value) return;
  uploading.value = true;
  error.value = null;
  result.value = null;
  try {
    const fd = new FormData();
    fd.append('file', file.value);
    result.value = await $fetch(
      `${config.public.apiBase}/api/shoots/${shootId.value}/media`,
      { method: 'POST', body: fd, credentials: 'include' },
    );
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Upload failed';
  } finally {
    uploading.value = false;
  }
};
</script>

<template>
  <main class="mx-auto flex max-w-xl flex-col gap-6 px-6 py-16">
    <h1 class="text-2xl font-bold">Upload demo</h1>
    <p class="text-sm text-zinc-500">
      Sends to <code>backend → photos.mytrees.family</code> with
      <code>source=cinderella</code> and the current photographer as the
      on-behalf-of user.
    </p>

    <label class="flex flex-col gap-1 text-sm">
      <span class="font-medium">Shoot ID</span>
      <input v-model.number="shootId" type="number" min="1"
             class="rounded-md border px-3 py-2 text-sm" />
    </label>

    <input type="file" @change="onFile" />

    <button
      class="rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
      :disabled="!file || uploading"
      @click="upload"
    >
      {{ uploading ? 'Uploading…' : 'Upload' }}
    </button>

    <pre v-if="result" class="overflow-auto rounded-md bg-zinc-900 p-3 text-xs text-zinc-100">{{ result }}</pre>
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <NuxtLink to="/" class="text-sm text-pink-600 hover:underline">← Home</NuxtLink>
  </main>
</template>
