<template>
  <div class="not-found">
    <div class="not-found-content">
      <div class="glitch-ticker mono-amber" aria-hidden="true">404</div>
      <h1 class="not-found-title">Page Not Found</h1>
      <p class="not-found-subtitle">
        This ticker doesn't exist in our universe.<br />
        Maybe it got delisted? 📉
      </p>
      <router-link to="/" class="btn btn-primary home-btn">
        ← Back to Dashboard
      </router-link>
    </div>
    <div class="tape" aria-hidden="true">
      <span v-for="n in 20" :key="n" class="tape-item mono-muted">
        $404.00 ▼ 100%&nbsp;&nbsp;
      </span>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.not-found-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  z-index: 1;
}

.glitch-ticker {
  font-size: 8rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  opacity: 0.15;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -65%);
  user-select: none;
}

.not-found-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-0);
  letter-spacing: -0.01em;
}

.not-found-subtitle {
  font-size: 0.95rem;
  color: var(--text-1);
  line-height: 1.6;
  max-width: 360px;
}

.home-btn {
  margin-top: 1rem;
  text-decoration: none;
}

.tape {
  position: absolute;
  bottom: 2rem;
  left: 0;
  right: 0;
  display: flex;
  overflow: hidden;
  white-space: nowrap;
  opacity: 0.3;
  animation: scroll-tape 30s linear infinite;
}

.tape-item {
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  flex-shrink: 0;
}

@keyframes scroll-tape {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@media (max-width: 768px) {
  .glitch-ticker { font-size: 5rem; }
  .not-found-title { font-size: 1.4rem; }
}
</style>
