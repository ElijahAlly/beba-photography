<script setup lang="ts">
const props = defineProps<{ shootId: number }>();
const emit = defineEmits<{ uploaded: [] }>();

const { public: { apiBase } } = useRuntimeConfig();
const { push } = useToast();

interface QueueItem {
  id: number;
  file: File;
  state: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
}

const queue = ref<QueueItem[]>([]);
const dragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
let nextId = 1;

const addFiles = (files: FileList | File[] | null) => {
  if (!files) return;
  for (const f of files) {
    queue.value.push({ id: nextId++, file: f, state: 'pending', progress: 0 });
  }
  void runQueue();
};

const onFilePick = (e: Event) => {
  const t = e.target as HTMLInputElement;
  addFiles(t.files);
  t.value = '';
};

const onDrop = (e: DragEvent) => {
  dragging.value = false;
  if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
};

let running = false;
async function runQueue() {
  if (running) return;
  running = true;
  try {
    while (true) {
      const next = queue.value.find((q) => q.state === 'pending');
      if (!next) break;
      await uploadOne(next);
    }
    const anyDone = queue.value.some((q) => q.state === 'done');
    if (anyDone) emit('uploaded');
  } finally {
    running = false;
  }
}

async function uploadOne(item: QueueItem) {
  item.state = 'uploading';
  item.progress = 0;

  try {
    // We use XHR (not fetch) here purely for upload progress events, which
    // fetch still doesn't expose in any browser as of writing.
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append('file', item.file, item.file.name);
      xhr.open('POST', `${apiBase}/api/shoots/${props.shootId}/media`);
      xhr.withCredentials = true;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) item.progress = Math.round((e.loaded / e.total) * 100);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          item.progress = 100;
          item.state = 'done';
          resolve();
        } else {
          let msg = `Upload failed (${xhr.status})`;
          try {
            const j = JSON.parse(xhr.responseText);
            msg = j?.message || msg;
          } catch { /* keep default */ }
          reject(new Error(msg));
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(form);
    });
  } catch (err) {
    item.state = 'error';
    item.error = (err as Error).message;
    push(`${item.file.name}: ${item.error}`, 'error');
  }
}

const clearDone = () => {
  queue.value = queue.value.filter((q) => q.state !== 'done');
};
</script>

<template>
  <div class="space-y-3">
    <label
      class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition"
      :class="dragging ? 'border-rose-400 bg-rose-50' : 'border-stone-300 bg-white hover:border-stone-400'"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <span class="text-3xl">📷</span>
      <span class="text-sm font-medium text-stone-700">
        Drop files here, or
        <span class="text-rose-600 underline">browse</span>
      </span>
      <span class="text-xs text-stone-500">Photos, videos, audio, documents</span>
      <input
        ref="fileInput"
        type="file"
        multiple
        class="hidden"
        @change="onFilePick"
      />
    </label>

    <ul v-if="queue.length > 0" class="space-y-2">
      <li
        v-for="item in queue"
        :key="item.id"
        class="rounded-lg border border-stone-200 bg-white p-3"
      >
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="truncate font-medium">{{ item.file.name }}</span>
          <span
            class="shrink-0 text-xs"
            :class="{
              'text-stone-500': item.state === 'pending',
              'text-stone-700': item.state === 'uploading',
              'text-emerald-600': item.state === 'done',
              'text-rose-600': item.state === 'error',
            }"
          >
            {{
              item.state === 'pending'
                ? 'Queued'
                : item.state === 'uploading'
                  ? `${item.progress}%`
                  : item.state === 'done'
                    ? 'Done'
                    : (item.error || 'Failed')
            }}
          </span>
        </div>
        <div
          v-if="item.state === 'uploading' || item.state === 'done'"
          class="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100"
        >
          <div
            class="h-full bg-rose-500 transition-[width]"
            :style="{ width: `${item.progress}%` }"
          />
        </div>
      </li>
    </ul>

    <div v-if="queue.some((q) => q.state === 'done')" class="text-right">
      <button
        class="text-xs text-stone-500 hover:text-stone-900 hover:underline"
        @click="clearDone"
      >
        Clear finished
      </button>
    </div>
  </div>
</template>
