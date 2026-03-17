<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
        <Transition name="slide-up">
          <div v-if="modelValue" class="modal-box" :style="maxWidth ? { maxWidth } : {}">
            <div v-if="$slots.header || title" class="modal-header">
              <h2 class="text-lg font-semibold text-gray-100">{{ title }}</h2>
              <slot name="header" />
              <button
                class="text-gray-500 hover:text-gray-300 transition-colors ml-auto"
                @click="$emit('update:modelValue', false)"
              >
                ✕
              </button>
            </div>
            <div class="modal-body">
              <slot />
            </div>
            <div v-if="$slots.footer" class="modal-footer">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  title?: string
  maxWidth?: string
}>()

defineEmits<{
  'update:modelValue': [val: boolean]
}>()
</script>
