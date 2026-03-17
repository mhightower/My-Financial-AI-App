import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useErrorStore = defineStore('error', () => {
  const errors = ref([])

  const hasErrors = computed(() => errors.value.length > 0)
  const latestError = computed(() => errors.value.length > 0 ? errors.value[errors.value.length - 1] : null)

  function addError(message, type = 'error', timeout = 5000) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    errors.value.push({ id, message, type })

    setTimeout(() => {
      dismissError(id)
    }, timeout)
  }

  function dismissError(id) {
    const idx = errors.value.findIndex(e => e.id === id)
    if (idx !== -1) {
      errors.value.splice(idx, 1)
    }
  }

  function clearAll() {
    errors.value = []
  }

  return { errors, hasErrors, latestError, addError, dismissError, clearAll }
})
