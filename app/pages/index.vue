<script setup lang="ts">
const counter = useCounterStore()
</script>

<template>
  <main id="main-content" class="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-24">
    <p class="text-sm font-medium uppercase tracking-wide text-primary">RuleForge</p>
    <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">
      Describe a fraud rule in plain English. Get a governed, no-code rule tree.
    </h1>
    <p class="max-w-xl text-lg text-muted-foreground">
      An intent agent drafts a rule tree from your description, a validator agent checks it for
      contradictions, and an explainer agent writes a plain-English summary — the rule compiles to
      a real MongoDB aggregation expression, previewed live against seeded orders.
    </p>
    <div class="flex items-center gap-4">
      <button
        type="button"
        class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        @click="counter.increment"
      >
        Pinia check: {{ counter.count }}
      </button>
    </div>
  </main>
</template>
