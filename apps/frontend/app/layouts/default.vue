<script setup lang="ts">
const { isAuthed, user, refresh, goLogin, logout } = useSession();
const { toasts, dismiss } = useToast();
const route = useRoute();

await refresh();

const menuOpen = ref(false);

const navLinks = computed(() => [
  { to: '/studio', label: 'Studio' },
  { to: '/shoots', label: 'Shoots' },
  { to: '/clients', label: 'Clients' },
  { to: '/my', label: 'Galleries' },
]);

const isActive = (to: string) =>
  route.path === to || route.path.startsWith(to + '/');

// Close the mobile menu whenever the route changes.
watch(() => route.fullPath, () => { menuOpen.value = false; });
</script>

<template>
  <div class="min-h-[100dvh] bg-stone-50 text-stone-900 antialiased">
    <header class="sticky top-0 z-30 border-b border-stone-200 bg-white/80 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3">
        <NuxtLink to="/" class="flex items-center gap-2 font-serif text-lg tracking-tight">
          <span class="text-rose-600">✦</span>
          <span>beba<span class="text-stone-400">.photography</span></span>
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
            <div class="max-w-[12rem] truncate font-medium text-stone-900">{{ user?.email }}</div>
          </div>
          <button
            v-if="isAuthed"
            class="hidden rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 sm:inline-block"
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

          <!-- Mobile menu toggle (authed only) -->
          <button
            v-if="isAuthed"
            class="-mr-2 flex h-10 w-10 items-center justify-center text-stone-700 sm:hidden"
            :aria-expanded="menuOpen"
            aria-label="Toggle menu"
            @click="menuOpen = !menuOpen"
          >
            <svg v-if="!menuOpen" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>
          </button>
        </div>
      </div>

      <!-- Mobile menu panel -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        leave-active-class="transition duration-150 ease-in"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <nav v-if="isAuthed && menuOpen" class="border-t border-stone-100 bg-white px-4 pb-4 pt-2 sm:hidden">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="block rounded-lg px-4 py-3 text-base font-medium transition-colors"
            :class="
              isActive(link.to)
                ? 'bg-stone-900 text-white'
                : 'text-stone-700 hover:bg-stone-100'
            "
          >
            {{ link.label }}
          </NuxtLink>

          <div class="mt-3 flex items-center justify-between gap-3 border-t border-stone-100 px-4 pt-4">
            <div class="min-w-0 text-xs">
              <div class="text-stone-500">Signed in as</div>
              <div class="truncate font-medium text-stone-900">{{ user?.email }}</div>
            </div>
            <button
              class="shrink-0 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
              @click="logout"
            >
              Sign out
            </button>
          </div>
        </nav>
      </Transition>
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
