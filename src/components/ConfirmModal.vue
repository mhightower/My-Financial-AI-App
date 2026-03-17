<template>
  <div
    v-if="modelValue"
    ref="trapRef"
    class="modal-overlay"
    role="alertdialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    @click.self="cancel"
    @keydown.escape="cancel"
  >
    <div class="modal modal-sm">
      <div class="modal-header">
        <h2 :id="titleId">{{ title }}</h2>
      </div>
      <div class="modal-body">
        <p class="confirm-message">{{ message }}</p>
        <div class="form-actions">
          <button type="button" @click="cancel" class="btn btn-ghost">Cancel</button>
          <button type="button" @click="confirm" class="btn btn-danger" ref="confirmBtnRef">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useFocusTrap } from '../composables/useFocusTrap'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Confirm' },
  message: { type: String, required: true },
  confirmLabel: { type: String, default: 'Delete' },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const isOpen = ref(props.modelValue)
const { trapRef } = useFocusTrap(isOpen)
const confirmBtnRef = ref(null)
const titleId = `confirm-title-${Math.random().toString(36).slice(2)}`

watch(() => props.modelValue, (val) => {
  isOpen.value = val
  if (val) nextTick(() => confirmBtnRef.value?.focus())
})

const cancel = () => emit('update:modelValue', false)
const confirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-sm {
  max-width: 380px;
}
.confirm-message {
  font-size: 0.9rem;
  color: var(--text-0);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}
</style>
