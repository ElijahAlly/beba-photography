<script setup lang="ts">
const { isAuthed, user, refresh, goLogin, logout } = useSession();
const { toasts, dismiss } = useToast();
const route = useRoute();

await refresh();

const navLinks = computed(() => [
  { to: '/', label: 'Studio' },
  { to: '/shoots', label: 'Shoots' },
  { to: '/clients', label: 'Clients' },
  { to: '/my', label: 'Galleries' },
]);

const isActive = (to: string) =>
  to === '/' ? route.path === '/' : route.path === to || route.path.startsWith(to + '/');
</script>

<template>
  <div class="min-h-[100dvh] bg-stone-50 text-stone-900 antialiased">
    <header class="sticky top-0 z-30 border-b border-stone-200 bg-white/80 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3">
        <NuxtLink to="/" class="flex items-center gap-2 font-serif text-lg tracking-tight">
          <span class="text-rose-600">✦</span>
          <span>cinderella<span class="text-stone-400">.photography</span></span>
        </NuxtLink>

        <nav v-if="isAuthed" class="hidden items-center gap-1 text-sm sm:flex">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="rounded-md px-3 py-1.5 font-medium transition-colors"
            :class="
              isActive(link.to)
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            "
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-3">
          <div v-if="isAuthed" class="hidden text-right text-xs sm:block">
            <div class="text-stone-500">Signed in as</div>
            <div class="truncate font-medium text-stone-900">{{ user?.email }}</div>
          </div>
          <button
            v-if="isAuthed"
            class="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
            @click="logout"
          >
            Sign out
          </button>
          <button
            v-else
            class="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            @click="goLogin()"
          >
            Sign in
          </button>
        </div>
      </div>

      <nav
        v-if="isAuthed"
        class="flex items-center gap-1 overflow-x-auto border-t border-stone-100 px-6 py-2 text-xs sm:hidden"
      >
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="whitespace-nowrap rounded-md px-3 py-1.5 font-medium"
          :class="
            isActive(link.to)
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          "
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
    </header>

    <main class="mx-auto max-w-6xl px-6 py-8">
      <slot />
    </main>

    <!-- Toasts -->
    <div class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto flex w-full max-w-sm items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg"
        :class="{
          'border-rose-300 bg-rose-50 text-rose-900': t.type === 'error',
          'border-emerald-300 bg-emerald-50 text-emerald-900': t.type === 'success',
          'border-stone-300 bg-white text-stone-900': t.type === 'info',
        }"
      >
        <span>{{ t.message }}</span>
        <button class="text-xs text-stone-500 hover:text-stone-900" @click="dismiss(t.id)">✕</button>
      </div>
    </div>
  </div>
</template>
