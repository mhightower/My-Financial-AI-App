import { ref, watch, nextTick, onUnmounted } from 'vue'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Traps keyboard focus inside a modal when it is open.
 * Returns a template ref to attach to the modal overlay element.
 *
 * Usage:
 *   const { trapRef } = useFocusTrap(isOpen)
 *   <div ref="trapRef" v-if="isOpen" class="modal-overlay"> ... </div>
 */
export function useFocusTrap(isOpenRef) {
  const trapRef = ref(null)
  let previouslyFocused = null

  function getFocusableElements() {
    if (!trapRef.value) return []
    return [...trapRef.value.querySelectorAll(FOCUSABLE_SELECTOR)]
  }

  function handleKeydown(e) {
    if (e.key !== 'Tab') return
    const focusable = getFocusableElements()
    if (focusable.length === 0) {
      e.preventDefault()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  function activate() {
    previouslyFocused = document.activeElement
    nextTick(() => {
      const focusable = getFocusableElements()
      if (focusable.length > 0) {
        focusable[0].focus()
      }
    })
    document.addEventListener('keydown', handleKeydown)
  }

  function deactivate() {
    document.removeEventListener('keydown', handleKeydown)
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus()
    }
    previouslyFocused = null
  }

  watch(isOpenRef, (val) => {
    if (val) activate()
    else deactivate()
  })

  onUnmounted(() => {
    deactivate()
  })

  return { trapRef }
}
