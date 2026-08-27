<script setup lang="ts">
import { ORDER_FIELDS, ORDER_FIELD_NAMES } from '#shared/types/order'
import type { Order } from '#shared/types/order'
import { RISK_TIERS, ACTIONS } from '#shared/types/rule'
import type { Condition, RuleTree, RiskTier, Action } from '#shared/types/rule'
import { evaluateRule } from '#shared/utils/evaluateRule'

const step = ref(1)
const totalSteps = 4

const field = ref<string>('amountCents')
const op = ref<'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq'>('gt')
const value = ref<number | string>(30000)
const tier = ref<RiskTier>('high')
const action = ref<Action>('block')

const orders = ref<Order[]>([])
onMounted(async () => {
  const res = await $fetch<{ orders: Order[] }>('/api/orders')
  orders.value = res.orders
})

const currentFieldMeta = computed(() => ORDER_FIELDS[field.value as keyof typeof ORDER_FIELDS])

watch(field, () => {
  op.value = 'eq'
  value.value = currentFieldMeta.value.type === 'enum' ? currentFieldMeta.value.values[0] : 0
})

const previewRule = computed<RuleTree>(() => ({
  name: 'Tutorial rule',
  branches: [
    {
      id: 'tutorial',
      combinator: 'and',
      conditions: [
        {
          kind: 'value',
          field: field.value,
          op: op.value,
          value: currentFieldMeta.value.type === 'number' ? Number(value.value) : value.value,
        } as Condition,
      ],
      tier: tier.value,
      action: action.value,
    },
  ],
  defaultTier: 'low',
  defaultAction: 'allow',
}))

const matchCount = computed(
  () => orders.value.filter((o) => evaluateRule(o, previewRule.value).matchedBranchId !== null).length
)

const router = useRouter()
const builder = useBuilderStore()

function finish() {
  builder.reset()
  builder.rule.name = 'My first rule'
  builder.rule.branches = previewRule.value.branches
  router.push('/builder')
}
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8">
    <h1 id="main-content" class="text-2xl font-semibold">Build your first rule</h1>

    <ol class="flex gap-2" aria-label="Progress">
      <li v-for="s in totalSteps" :key="s" class="flex-1">
        <div
          class="h-1.5 rounded-full"
          :class="s <= step ? 'bg-primary' : 'bg-secondary'"
          :aria-current="s === step ? 'step' : undefined"
        />
      </li>
    </ol>
    <p class="text-sm text-muted-foreground" role="status">Step {{ step }} of {{ totalSteps }}</p>

    <section v-if="step === 1" aria-labelledby="step1-heading" class="flex flex-col gap-4">
      <h2 id="step1-heading" class="text-lg font-semibold">What's a rule?</h2>
      <p class="text-sm text-muted-foreground">
        A RuleForge rule is a list of <strong>branches</strong>, checked in order. Each branch says:
        "if these conditions match an order, set its risk to X and take action Y." If nothing
        matches, a default applies. Let's build one branch together.
      </p>
      <button type="button" class="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" @click="step = 2">
        Let's go
      </button>
    </section>

    <section v-else-if="step === 2" aria-labelledby="step2-heading" class="flex flex-col gap-4">
      <h2 id="step2-heading" class="text-lg font-semibold">Pick a condition</h2>
      <p class="text-sm text-muted-foreground">
        Choose a field on an order, how to compare it, and a value. We'll show you live how many
        orders it matches as you go.
      </p>

      <div class="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-3">
        <label for="tut-field" class="sr-only">Field</label>
        <select id="tut-field" v-model="field" class="rounded border border-input bg-background px-2 py-1 text-sm">
          <option v-for="f in ORDER_FIELD_NAMES" :key="f" :value="f">
            {{ ORDER_FIELDS[f as keyof typeof ORDER_FIELDS].label }}
          </option>
        </select>
        <label for="tut-op" class="sr-only">Operator</label>
        <select id="tut-op" v-model="op" class="rounded border border-input bg-background px-2 py-1 text-sm">
          <option value="gt" :disabled="currentFieldMeta.type !== 'number'">&gt;</option>
          <option value="lt" :disabled="currentFieldMeta.type !== 'number'">&lt;</option>
          <option value="eq">is</option>
          <option value="neq">is not</option>
        </select>
        <template v-if="currentFieldMeta.type === 'enum'">
          <label for="tut-value" class="sr-only">Value</label>
          <select id="tut-value" v-model="value" class="rounded border border-input bg-background px-2 py-1 text-sm">
            <option v-for="v in currentFieldMeta.values" :key="v" :value="v">{{ v }}</option>
          </select>
        </template>
        <template v-else>
          <label for="tut-value" class="sr-only">Value</label>
          <input id="tut-value" v-model.number="value" type="number" class="w-28 rounded border border-input bg-background px-2 py-1 text-sm" />
        </template>
      </div>

      <p role="status" aria-live="polite" class="rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
        This condition currently matches <strong>{{ matchCount }}</strong> of {{ orders.length }} seeded
        orders.
      </p>

      <div class="flex gap-2">
        <button type="button" class="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent" @click="step = 1">Back</button>
        <button type="button" class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" @click="step = 3">Next</button>
      </div>
    </section>

    <section v-else-if="step === 3" aria-labelledby="step3-heading" class="flex flex-col gap-4">
      <h2 id="step3-heading" class="text-lg font-semibold">Set the outcome</h2>
      <p class="text-sm text-muted-foreground">
        When this condition matches, what risk tier and action should the order get?
      </p>
      <div class="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-3 text-sm">
        <span class="text-muted-foreground">Set risk to</span>
        <label for="tut-tier" class="sr-only">Risk tier</label>
        <select id="tut-tier" v-model="tier" class="rounded border border-input bg-background px-2 py-1 text-sm capitalize">
          <option v-for="t in RISK_TIERS" :key="t" :value="t">{{ t }}</option>
        </select>
        <span class="text-muted-foreground">and</span>
        <label for="tut-action" class="sr-only">Action</label>
        <select id="tut-action" v-model="action" class="rounded border border-input bg-background px-2 py-1 text-sm capitalize">
          <option v-for="a in ACTIONS" :key="a" :value="a">{{ a }}</option>
        </select>
      </div>
      <div class="flex gap-2">
        <button type="button" class="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent" @click="step = 2">Back</button>
        <button type="button" class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" @click="step = 4">Next</button>
      </div>
    </section>

    <section v-else aria-labelledby="step4-heading" class="flex flex-col gap-4">
      <h2 id="step4-heading" class="text-lg font-semibold">Here's your rule</h2>
      <p class="rounded-md bg-secondary px-3 py-3 text-sm text-secondary-foreground">
        If <strong>{{ ORDER_FIELDS[field as keyof typeof ORDER_FIELDS].label }}</strong>
        {{ op === 'gt' ? 'is greater than' : op === 'lt' ? 'is less than' : op === 'eq' ? 'is' : 'is not' }}
        <strong>{{ value }}</strong>, set risk to <strong class="capitalize">{{ tier }}</strong> and
        <strong class="capitalize">{{ action }}</strong> the order. That matches
        <strong>{{ matchCount }}</strong> of {{ orders.length }} seeded orders today.
      </p>
      <p class="text-sm text-muted-foreground">
        You can add more branches, edit conditions, and save this rule once you're in the builder.
      </p>
      <div class="flex gap-2">
        <button type="button" class="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent" @click="step = 3">Back</button>
        <button type="button" class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" @click="finish">
          Open in builder
        </button>
      </div>
    </section>
  </div>
</template>
