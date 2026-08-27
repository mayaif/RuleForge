<script setup lang="ts">
import type { SavedRuleSummary } from '#shared/types/savedRule'

const rules = ref<SavedRuleSummary[] | null>(null)
const activatingId = ref<string | null>(null)

async function load() {
  const res = await $fetch<{ rules: SavedRuleSummary[] }>('/api/saved-rules')
  rules.value = res.rules
}
onMounted(load)

async function activate(id: string) {
  activatingId.value = id
  await $fetch(`/api/saved-rules/${id}/activate`, { method: 'POST' })
  await load()
  activatingId.value = null
}

async function remove(id: string, name: string) {
  if (!confirm(`Delete "${name}"?`)) return
  await $fetch(`/api/saved-rules/${id}`, { method: 'DELETE' })
  await load()
}
</script>

<template>
  <main id="main-content" class="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-8">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Saved rules</h1>
      <NuxtLink
        to="/builder"
        class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
      >
        + New rule
      </NuxtLink>
    </div>

    <p v-if="rules === null" class="text-sm text-muted-foreground">Loading…</p>

    <div v-else-if="rules.length === 0" class="rounded-lg border border-dashed border-border p-8 text-center">
      <p class="text-muted-foreground">
        No saved rules yet.
        <NuxtLink to="/builder" class="text-primary underline underline-offset-2">Build one</NuxtLink>
        to get started.
      </p>
    </div>

    <ul v-else class="flex flex-col gap-3">
      <li
        v-for="r in rules"
        :key="r.id"
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
      >
        <div>
          <div class="flex items-center gap-2">
            <h2 class="font-semibold">{{ r.name }}</h2>
            <span
              v-if="r.active"
              class="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
            >
              Active
            </span>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ r.summary.allow }} allow · {{ r.summary.review }} review · {{ r.summary.block }} block
            &middot; updated {{ new Date(r.updatedAt).toLocaleDateString() }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <NuxtLink
            :to="`/builder?id=${r.id}`"
            class="rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            Edit
          </NuxtLink>
          <button
            type="button"
            class="rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-60"
            :disabled="r.active || activatingId === r.id"
            @click="activate(r.id)"
          >
            {{ r.active ? 'Active' : activatingId === r.id ? 'Activating…' : 'Activate' }}
          </button>
          <button
            type="button"
            class="rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-destructive"
            :aria-label="`Delete ${r.name}`"
            @click="remove(r.id, r.name)"
          >
            Delete
          </button>
        </div>
      </li>
    </ul>
  </main>
</template>
