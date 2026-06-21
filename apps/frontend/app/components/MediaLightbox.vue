<script setup lang="ts">
interface MediaItem {
  id: number;
  shootId: number;
  filename: string;
  type: string;
}

const props = defineProps<{
  items: MediaItem[];
  modelValue: number | null; // index of open item, or null when closed
}>();
const emit = defineEmits<{ 'update:modelValue': [n: number | null] }>();

const { public: { apiBase } } = useRuntimeConfig();
const rawUrl = (m: MediaItem) => `${apiBase}/api/shoots/${m.shootId}/media/${m.id}/raw`;
const downloadUrl = (m: MediaItem) => `${rawUrl(m)}?download=1`;

const current = computed(() =>
  props.modelValue == null ? null : props.items[props.modelValue] ?? null,
);

const close = () => emit('update:modelValue', null);
const prev = () => {
  if (props.modelValue == null) return;
  emit('update:modelValue', (props.modelValue - 1 + props.items.length) % props.items.length);
};
const next = () => {
  if (props.modelValue == null) return;
  emit('update:modelValue', (props.modelValue + 1) % props.items.length);
};

const onKey = (e: KeyboardEvent) => {
  if (props.modelValue == null) return;
  if (e.key === 'Escape') close();
  if (e.key === 'ArrowLeft') prev();
  if (e.key === 'ArrowRight') next();
};

onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <Teleport to="body">
    <div
      v-if="current"
      class="fixed inset-0 z-50 flex flex-col bg-stone-950/95 text-stone-100"
      @click.self="close"
    >
      <!-- Header -->
      <div class="flex items-center justify-between gap-4 px-4 py-3 text-sm">
        <div class="truncate">
          <div class="font-medium">{{ current.filename }}</div>
          <div class="text-xs text-stone-400">
            {{ (modelValue ?? 0) + 1 }} of {{ items.length }} · {{ current.type }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <a
            :href="downloadUrl(current)"
            class="rounded-md border border-stone-700 px-3 py-1.5 text-xs font-medium text-stone-100 hover:bg-stone-800"
            download
          >
            Download
          </a>
          <button
            class="rounded-md border border-stone-700 px-3 py-1.5 text-xs font-medium hover:bg-stone-800"
            @click="close"
          >
            Close (Esc)
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="flex flex-1 items-center justify-center px-4 pb-4">
        <button
          v-if="items.length > 1"
          class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-stone-800/80 px-4 py-2 text-xl hover:bg-stone-700"
          @click="prev"
          aria-label="Previous"
        >
          ‹
        </button>

        <img
          v-if="current.type === 'image'"
          :src="rawUrl(current)"
          :alt="current.filename"
          class="max-h-full max-w-full object-contain"
          @click.stop
        />
        <video
          v-else-if="current.type === 'video'"
          :src="rawUrl(current)"
          controls
          autoplay
          class="max-h-full max-w-full"
          @click.stop
        />
        <audio
          v-else-if="current.type === 'audio'"
          :src="rawUrl(current)"
          controls
          autoplay
          class="w-full max-w-lg"
          @click.stop
        />
        <div
          v-else
          class="flex flex-col items-center gap-4 rounded-lg border border-stone-700 bg-stone-900 p-8"
          @click.stop
        >
          <span class="text-5xl">📄</span>
          <p class="text-sm text-stone-300">{{ current.filename }}</p>
          <a
            :href="downloadUrl(current)"
            class="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            download
          >
            Download
          </a>
        </div>

        <button
          v-if="items.length > 1"
          class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-stone-800/80 px-4 py-2 text-xl hover:bg-stone-700"
          @click="next"
          aria-label="Next"
        >
          ›
        </button>
      </div>
    </div>
  </Teleport>
</template>
