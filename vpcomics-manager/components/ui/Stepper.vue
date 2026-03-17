<template>
  <div class="flex items-center gap-1">
    <button
      class="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-300 text-sm font-bold leading-none flex items-center justify-center transition-colors select-none"
      @click="dec"
    >−</button>
    <span
      class="font-mono text-sm tabular-nums text-center"
      :style="{ minWidth: minWidth }"
      :class="colorClass"
    >{{ modelValue }}</span>
    <button
      class="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-300 text-sm font-bold leading-none flex items-center justify-center transition-colors select-none"
      @click="inc"
    >+</button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: number
  min?: number
  max?: number
  /** colour the number red/amber when low (for stock counts) */
  colorCode?: boolean
  /** minimum width of the number span, e.g. "2rem" */
  minWidth?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [v: number] }>()

const colorClass = computed(() => {
  if (!props.colorCode) return 'text-gray-200'
  if (props.modelValue === 0) return 'text-red-400'
  if (props.modelValue <= 5) return 'text-amber-400'
  return 'text-gray-200'
})

function dec() {
  const next = props.modelValue - 1
  const min = props.min ?? 0
  emit('update:modelValue', Math.max(min, next))
}

function inc() {
  const next = props.modelValue + 1
  const max = props.max
  emit('update:modelValue', max !== undefined ? Math.min(max, next) : next)
}
</script>
