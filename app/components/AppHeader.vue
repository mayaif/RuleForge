<script setup lang="ts">
const links = [
  { to: '/tutorial', label: 'Tutorial' },
  { to: '/builder', label: 'Builder' },
  { to: '/rules', label: 'Rules' },
  { to: '/dashboard', label: 'Dashboard' },
]
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
    <div class="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-3">
      <NuxtLink to="/" class="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
        <svg viewBox="0 0 24 24" class="h-6 w-6 text-primary" fill="currentColor" aria-hidden="true">
          <path d="M12 2 3 5v6c0 5 3.8 9.4 9 11 5.2-1.6 9-6 9-11V5l-9-3Z" />
        </svg>
        RuleForge
      </NuxtLink>

      <nav class="flex items-center gap-6 text-sm font-medium text-muted-foreground sm:gap-8">
        <NuxtLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="transition-colors hover:text-foreground"
          active-class="text-foreground"
        >
          {{ l.label }}
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
