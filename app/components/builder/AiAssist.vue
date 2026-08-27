<script setup lang="ts">
import type { RuleTree } from '#shared/types/rule'

type PipelineEvent =
  | { stage: 'drafting' | 'reviewing' | 'revising' | 'previewing' | 'explaining'; message: string }
  | { stage: 'done'; rule: RuleTree; summary: { allow: number; review: number; block: number }; explanation: string }
  | { stage: 'error'; message: string }

const builder = useBuilderStore()

const description = ref('')
const log = ref<string[]>([])
const running = ref(false)
const errorMessage = ref<string | null>(null)

const examples = [
  'Flag orders over $500 shipping to a different country than billing, from accounts under 7 days old',
  'Block orders from customers with any prior chargebacks',
  'Review any order where the IP country does not match the billing country',
]

async function run() {
  if (!description.value.trim() || running.value) return
  running.value = true
  log.value = []
  errorMessage.value = null

  const res = await fetch('/api/rules/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: description.value }),
  })

  if (!res.body) {
    errorMessage.value = 'No response from server.'
    running.value = false
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() ?? ''

    for (const chunk of chunks) {
      const line = chunk.replace(/^data:\s*/, '')
      if (!line) continue
      try {
        const event: PipelineEvent = JSON.parse(line)
        if (event.stage === 'done') {
          builder.applyGeneratedRule(event.rule, event.explanation)
        } else if (event.stage === 'error') {
          errorMessage.value = event.message
        } else {
          log.value.push(event.message)
        }
      } catch {
        // ignore malformed keepalive chunks
      }
    }
  }

  running.value = false
}
</script>

<template>
  <section aria-labelledby="ai-assist-heading" class="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
    <h2 id="ai-assist-heading" class="text-sm font-semibold">Describe a rule</h2>
    <label for="ai-assist-description" class="sr-only">Describe the fraud rule you want in plain English</label>
    <textarea
      id="ai-assist-description"
      v-model="description"
      rows="2"
      placeholder="e.g. Flag orders over $500 shipping to a different country than billing, from accounts under 7 days old"
      class="rounded-md border border-input bg-background px-3 py-2 text-sm"
    />
    <div class="flex flex-wrap gap-2">
      <button
        v-for="ex in examples"
        :key="ex"
        type="button"
        class="rounded-full border border-input px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
        @click="description = ex"
      >
        {{ ex.length > 50 ? ex.slice(0, 50) + '…' : ex }}
      </button>
    </div>
    <button
      type="button"
      class="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      :disabled="running || !description.trim()"
      @click="run"
    >
      {{ running ? 'Thinking…' : 'Generate rule' }}
    </button>

    <div aria-live="polite" class="flex flex-col gap-1 text-sm text-muted-foreground">
      <p v-for="(m, i) in log" :key="i">{{ m }}</p>
    </div>
    <p v-if="errorMessage" role="alert" class="text-sm text-destructive">{{ errorMessage }}</p>
  </section>
</template>
