<template>
  <div
    v-if="modelValue"
    ref="trapRef"
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="analysis-modal-title"
    @click.self="$emit('update:modelValue', false)"
    @keydown.escape="$emit('update:modelValue', false)"
  >
    <div class="modal modal-wide">
      <div class="modal-header">
        <h2 id="analysis-modal-title">Thesis Analysis — <span class="mono-amber">{{ stock?.ticker }}</span></h2>
        <button @click="$emit('update:modelValue', false)" class="close-btn" aria-label="Close">✕</button>
      </div>
      <div class="modal-body" v-if="result">
        <div class="analysis-score-row">
          <div class="score-badge" :class="scoreClass">{{ result.quality_score }}<span style="font-size:1rem; font-weight:400;">/10</span></div>
          <span class="conviction-badge">{{ result.conviction_level }} conviction</span>
        </div>
        <div class="analysis-grid">
          <div class="analysis-section">
            <span class="analysis-label strengths-label">Strengths</span>
            <ul>
              <li v-for="(s, i) in result.strengths" :key="i" class="strength-item">{{ s }}</li>
            </ul>
          </div>
          <div class="analysis-section">
            <span class="analysis-label blind-spots-label">Blind Spots</span>
            <ul>
              <li v-for="(b, i) in result.blind_spots" :key="i" class="blind-spot-item">{{ b }}</li>
            </ul>
          </div>
          <div class="analysis-section">
            <span class="analysis-label suggestions-label">Suggestions</span>
            <ul>
              <li v-for="(s, i) in result.suggestions" :key="i" class="suggestion-item">{{ s }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { toRef } from 'vue'
import { useFocusTrap } from '../composables/useFocusTrap'

const props = defineProps({
  modelValue: Boolean,
  stock: Object,
  result: Object,
  scoreClass: String
})

defineEmits(['update:modelValue'])

const { trapRef } = useFocusTrap(toRef(props, 'modelValue'))
</script>

<style scoped>
.analysis-score-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1.25rem;
}
.score-badge {
  font-family: var(--font-mono);
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
}
.score-good { color: var(--green); }
.score-neutral { color: var(--amber); }
.score-poor { color: var(--red); }

.conviction-badge {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-1);
  border: 1px solid var(--border-hi);
  padding: 0.3rem 0.7rem;
  border-radius: 2rem;
}
.analysis-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
.analysis-section {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.analysis-label {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.strengths-label { color: var(--green); }
.blind-spots-label { color: var(--red); }
.suggestions-label { color: var(--amber); }

.analysis-section ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
}
.analysis-section li {
  font-size: 0.82rem;
  color: var(--text-0);
  line-height: 1.55;
  padding-left: 0.85rem;
  position: relative;
}
.analysis-section li::before {
  content: "·";
  position: absolute;
  left: 0;
  font-weight: 700;
}
.strength-item::before { color: var(--green); }
.blind-spot-item::before { color: var(--red); }
.suggestion-item::before { color: var(--amber); }

@media (max-width: 640px) {
  .analysis-grid { grid-template-columns: 1fr; }
}
</style>
