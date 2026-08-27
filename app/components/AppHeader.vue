<script setup lang="ts"></script>

<template>
  <header class="border-b border-border">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <NuxtLink to="/" class="font-semibold">RuleForge</NuxtLink>
      <nav class="flex gap-4 text-sm text-muted-foreground">
        <NuxtLink to="/builder" class="hover:text-foreground">Builder</NuxtLink>
        <NuxtLink to="/rules" class="hover:text-foreground">Rules</NuxtLink>
        <NuxtLink to="/dashboard" class="hover:text-foreground">Dashboard</NuxtLink>
      </nav>
    </div>
  </header>
</template>
