import { createApp } from 'vue'
import './styles/buttons.css'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useErrorStore } from './stores/error'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue Error]', err, info)
  const errorStore = useErrorStore()
  const message = err?.message || 'An unexpected application error occurred.'
  errorStore.addError(message, 'error', 8000)
}

app.config.warnHandler = (msg, instance, trace) => {
  // Only surface warnings in development
  if (import.meta.env.DEV) {
    console.warn('[Vue Warning]', msg, trace)
  }
}

app.mount('#app')
