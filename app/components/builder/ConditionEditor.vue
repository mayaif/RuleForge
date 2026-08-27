<script setup lang="ts">
import { ORDER_FIELDS, ORDER_FIELD_NAMES } from '#shared/types/order'
import { VALUE_OPS, FIELD_OPS } from '#shared/types/rule'
import type { Condition } from '#shared/types/rule'

const props = defineProps<{ condition: Condition; branchId: string; index: number; canRemove: boolean }>()
const emit = defineEmits<{
  update: [condition: Condition]
  remove: []
}>()

const OP_LABELS: Record<string, string> = {
  eq: 'is',
  neq: 'is not',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
}

const currentField = computed(() => ORDER_FIELDS[props.condition.field as keyof typeof ORDER_FIELDS])

const availableOps = computed(() => {
  if (props.condition.kind === 'field') return FIELD_OPS
  return currentField.value.type === 'number' ? VALUE_OPS : (['eq', 'neq'] as const)
})

const compareFieldOptions = computed(() =>
  ORDER_FIELD_NAMES.filter((f) => {
    if (f === props.condition.field) return false
    return ORDER_FIELDS[f as keyof typeof ORDER_FIELDS].type === currentField.value.type
  })
)

function handleKindChange(kind: 'value' | 'field') {
  if (kind === 'value') {
    emit('update', {
      kind: 'value',
      field: props.condition.field,
      op: 'eq',
      value: currentField.value.type === 'enum' ? currentField.value.values[0] : 0,
    })
  } else {
    const compareField = compareFieldOptions.value[0] ?? props.condition.field
    emit('update', { kind: 'field', field: props.condition.field, op: 'eq', compareField })
  }
}

function handleFieldChange(field: string) {
  const newFieldMeta = ORDER_FIELDS[field as keyof typeof ORDER_FIELDS]
  if (props.condition.kind === 'value') {
    emit('update', {
      kind: 'value',
      field,
      op: 'eq',
      value: newFieldMeta.type === 'enum' ? newFieldMeta.values[0] : 0,
    })
  } else {
    const compareField = ORDER_FIELD_NAMES.find(
      (f) => f !== field && ORDER_FIELDS[f as keyof typeof ORDER_FIELDS].type === newFieldMeta.type
    )
    emit('update', { kind: 'field', field, op: 'eq', compareField: compareField ?? field })
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 rounded-md border border-border bg-background p-2">
    <label :for="`${branchId}-cond-${index}-field`" class="sr-only">Field</label>
    <select
      :id="`${branchId}-cond-${index}-field`"
      :value="condition.field"
      class="rounded border border-input bg-card px-2 py-1 text-sm"
      @change="handleFieldChange(($event.target as HTMLSelectElement).value)"
    >
      <option v-for="f in ORDER_FIELD_NAMES" :key="f" :value="f">
        {{ ORDER_FIELDS[f as keyof typeof ORDER_FIELDS].label }}
      </option>
    </select>

    <label :for="`${branchId}-cond-${index}-op`" class="sr-only">Operator</label>
    <select
      :id="`${branchId}-cond-${index}-op`"
      :value="condition.op"
      class="rounded border border-input bg-card px-2 py-1 text-sm"
      @change="emit('update', { ...condition, op: ($event.target as HTMLSelectElement).value } as Condition)"
    >
      <option v-for="op in availableOps" :key="op" :value="op">{{ OP_LABELS[op] }}</option>
    </select>

    <label :for="`${branchId}-cond-${index}-kind`" class="sr-only">Compare against</label>
    <select
      :id="`${branchId}-cond-${index}-kind`"
      :value="condition.kind"
      class="rounded border border-input bg-card px-2 py-1 text-sm"
      @change="handleKindChange(($event.target as HTMLSelectElement).value as 'value' | 'field')"
    >
      <option value="value">a value</option>
      <option value="field">another field</option>
    </select>

    <template v-if="condition.kind === 'value'">
      <template v-if="currentField.type === 'enum'">
        <label :for="`${branchId}-cond-${index}-value`" class="sr-only">Value</label>
        <select
          :id="`${branchId}-cond-${index}-value`"
          :value="condition.value"
          class="rounded border border-input bg-card px-2 py-1 text-sm"
          @change="emit('update', { ...condition, value: ($event.target as HTMLSelectElement).value } as Condition)"
        >
          <option v-for="v in currentField.values" :key="v" :value="v">{{ v }}</option>
        </select>
      </template>
      <template v-else>
        <label :for="`${branchId}-cond-${index}-value`" class="sr-only">Value</label>
        <input
          :id="`${branchId}-cond-${index}-value`"
          type="number"
          :value="condition.value"
          class="w-28 rounded border border-input bg-card px-2 py-1 text-sm"
          @input="emit('update', { ...condition, value: Number(($event.target as HTMLInputElement).value) } as Condition)"
        />
      </template>
    </template>
    <template v-else>
      <label :for="`${branchId}-cond-${index}-compare`" class="sr-only">Compare field</label>
      <select
        :id="`${branchId}-cond-${index}-compare`"
        :value="condition.compareField"
        class="rounded border border-input bg-card px-2 py-1 text-sm"
        @change="emit('update', { ...condition, compareField: ($event.target as HTMLSelectElement).value } as Condition)"
      >
        <option v-for="f in compareFieldOptions" :key="f" :value="f">
          {{ ORDER_FIELDS[f as keyof typeof ORDER_FIELDS].label }}
        </option>
      </select>
    </template>

    <button
      v-if="canRemove"
      type="button"
      class="ml-auto rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-destructive"
      :aria-label="`Remove condition ${index + 1}`"
      @click="emit('remove')"
    >
      Remove
    </button>
  </div>
</template>
