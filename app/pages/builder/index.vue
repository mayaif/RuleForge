<script setup lang="ts">
import { RISK_TIERS, ACTIONS } from '#shared/types/rule'
import BranchEditor from '../../components/builder/BranchEditor.vue'
import TriageQueue from '../../components/builder/TriageQueue.vue'
import AiAssist from '../../components/builder/AiAssist.vue'

const builder = useBuilderStore()
onMounted(() => builder.fetchOrders())
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
    <header class="flex items-center justify-between">
      <NuxtLink to="/" class="text-sm text-muted-foreground hover:text-foreground">← RuleForge</NuxtLink>
    </header>

    <AiAssist />

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section aria-labelledby="rule-heading" class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div>
            <label for="rule-name" class="sr-only">Rule name</label>
            <input
              id="rule-name"
              :value="builder.rule.name"
              class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-lg font-semibold"
              @input="builder.setName(($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>

        <p id="rule-heading" class="text-sm text-muted-foreground">
          Branches are checked in order — the first one that matches wins. Nothing matches? Falls
          through to the default below.
        </p>

        <BranchEditor
          v-for="(branch, i) in builder.rule.branches"
          :key="branch.id"
          :branch="branch"
          :index="i"
          :total="builder.rule.branches.length"
        />

        <button
          type="button"
          class="self-start rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-accent"
          @click="builder.addBranch()"
        >
          + Add branch
        </button>

        <div class="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border p-4 text-sm">
          <span class="text-muted-foreground">Otherwise, set risk to</span>
          <label for="default-tier" class="sr-only">Default risk tier</label>
          <select
            id="default-tier"
            :value="builder.rule.defaultTier"
            class="rounded border border-input bg-background px-2 py-1 text-sm capitalize"
            @change="builder.setDefault(($event.target as HTMLSelectElement).value as typeof builder.rule.defaultTier, builder.rule.defaultAction)"
          >
            <option v-for="t in RISK_TIERS" :key="t" :value="t">{{ t }}</option>
          </select>
          <span class="text-muted-foreground">and</span>
          <label for="default-action" class="sr-only">Default action</label>
          <select
            id="default-action"
            :value="builder.rule.defaultAction"
            class="rounded border border-input bg-background px-2 py-1 text-sm capitalize"
            @change="builder.setDefault(builder.rule.defaultTier, ($event.target as HTMLSelectElement).value as typeof builder.rule.defaultAction)"
          >
            <option v-for="a in ACTIONS" :key="a" :value="a">{{ a }}</option>
          </select>
          <span class="text-muted-foreground">the order.</span>
        </div>

        <p v-if="builder.explanation" class="rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
          {{ builder.explanation }}
        </p>
      </section>

      <TriageQueue />
    </div>
  </div>
</template>
