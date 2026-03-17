import { ref, computed } from 'vue'
import * as api from '../services/api'

export function useAIThesis() {
  // Analyzer state
  const analyzingId = ref(null)
  const showAnalysisModal = ref(false)
  const analysisResult = ref(null)
  const analysisStock = ref(null)
  const analysisError = ref(null)

  const scoreClass = computed(() => {
    const s = analysisResult.value?.quality_score ?? 0
    if (s >= 7) return 'score-good'
    if (s >= 5) return 'score-neutral'
    return 'score-poor'
  })

  const analyzeThesis = async (stock) => {
    analyzingId.value = stock.id
    analysisError.value = null
    try {
      const response = await api.ai.analyzeThesis({
        ticker: stock.ticker,
        buy_reasons: stock.buy_reasons || '',
        sell_conditions: stock.sell_conditions || ''
      })
      analysisResult.value = response.data
      analysisStock.value = stock
      showAnalysisModal.value = true
    } catch {
      analysisError.value = 'Analysis failed. Try again shortly.'
    } finally {
      analyzingId.value = null
    }
  }

  // Draft generator state
  const generatingDraft = ref(false)
  const draftError = ref(null)

  const generateThesisDraft = async (ticker, form) => {
    if (!ticker) return
    generatingDraft.value = true
    draftError.value = null
    try {
      const response = await api.ai.draftThesis(ticker.toUpperCase())
      form.buy_reasons = response.data.buy_reasons
      form.sell_conditions = response.data.sell_conditions
    } catch {
      draftError.value = 'Could not generate draft. Enter a valid ticker and try again.'
    } finally {
      generatingDraft.value = false
    }
  }

  return {
    analyzingId,
    showAnalysisModal,
    analysisResult,
    analysisStock,
    analysisError,
    scoreClass,
    analyzeThesis,
    generatingDraft,
    draftError,
    generateThesisDraft,
  }
}
