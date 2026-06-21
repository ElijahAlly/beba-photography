<script setup lang="ts">
interface MediaItem {
  id: number;
  shootId: number;
  filename: string;
  type: string;
  width?: number | null;
  height?: number | null;
}

const props = defineProps<{
  shootId: number;
  items: MediaItem[];
}>();

const emit = defineEmits<{ open: [index: number] }>();
const { public: { apiBase } } = useRuntimeConfig();

const thumbUrl = (m: MediaItem) =>
  `${apiBase}/api/shoots/${m.shootId}/media/${m.id}/thumb`;

const iconForType = (t: string) => {
  switch (t) {
    case 'video': return '▶';
    case 'audio': return '♪';
    case 'document': return '📄';
    default: return '';
  }
};
</script>

<template>
  <div v-if="items.length === 0" class="rounded-lg border border-dashed border-stone-300 bg-white py-12 text-center text-sm text-stone-500">
    No media yet.
  </div>
  <div
    v-else
    class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
  >
    <button
      v-for="(m, i) in items"
      :key="m.id"
      type="button"
      class="group relative aspect-square overflow-hidden rounded-lg border border-stone-200 bg-stone-100 transition hover:border-stone-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500"
      @click="emit('open', i)"
    >
      <!-- Image / video poster thumbnails -->
      <img
        v-if="m.type === 'image' || m.type === 'video'"
        :src="thumbUrl(m)"
        :alt="m.filename"
        loading="lazy"
        class="h-full w-full object-cover transition group-hover:scale-105"
      />
      <!-- Audio / document fallback -->
      <div
        v-else
        class="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center text-stone-500"
      >
        <span class="text-3xl">{{ iconForType(m.type) }}</span>
        <span class="line-clamp-2 text-[10px]">{{ m.filename }}</span>
      </div>

      <!-- Type badge -->
      <span
        v-if="m.type !== 'image'"
        class="absolute left-2 top-2 rounded-full bg-stone-900/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur"
      >
        {{ m.type }}
      </span>
    </button>
  </div>
</template>
