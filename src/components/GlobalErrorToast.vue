<template>
  <Teleport to="body">
    <div v-if="errorStore.hasErrors" class="error-toast-container" role="alert" aria-live="assertive" aria-atomic="false">
      <TransitionGroup name="toast" tag="div" class="toast-list">
        <div
          v-for="error in errorStore.errors"
          :key="error.id"
          class="error-toast"
          :class="[`toast-${error.type}`]"
        >
          <span class="toast-icon" aria-hidden="true">{{ error.type === 'warning' ? '⚠' : '✕' }}</span>
          <span class="toast-message">{{ error.message }}</span>
          <button
            class="toast-close"
            :aria-label="`Dismiss: ${error.message}`"
            @click="errorStore.dismissError(error.id)"
          >✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useErrorStore } from '../stores/error'

const errorStore = useErrorStore()
</script>

<style scoped>
.error-toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-width: 400px;
  width: calc(100vw - 3rem);
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.error-toast {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius);
  font-size: 0.85rem;
  line-height: 1.45;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  border: 1px solid transparent;
}

.toast-error {
  background: #1a0a0a;
  border-color: rgba(224, 69, 69, 0.4);
  color: #f08080;
}

.toast-warning {
  background: #1a1200;
  border-color: rgba(217, 157, 56, 0.4);
  color: var(--amber-hi);
}

.toast-icon {
  flex-shrink: 0;
  font-size: 0.8rem;
  margin-top: 0.1rem;
}

.toast-message {
  flex: 1;
  word-break: break-word;
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  line-height: 1;
  padding: 0.1rem 0.2rem;
  border-radius: var(--radius-sm);
  opacity: 0.6;
  transition: opacity 0.15s;
}

.toast-error .toast-close {
  color: #f08080;
}

.toast-warning .toast-close {
  color: var(--amber-hi);
}

.toast-close:hover {
  opacity: 1;
}

.toast-close:focus-visible {
  outline: 2px solid var(--amber);
  outline-offset: 2px;
  opacity: 1;
}

/* Transition animations */
.toast-enter-active {
  transition: all 0.25s ease-out;
}

.toast-leave-active {
  transition: all 0.2s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(1.5rem);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(1.5rem);
}

@media (max-width: 768px) {
  .error-toast-container {
    bottom: 1rem;
    right: 0.75rem;
    left: 0.75rem;
    width: auto;
    max-width: none;
  }
}
</style>
