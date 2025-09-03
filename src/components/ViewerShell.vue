<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue';

const props = defineProps({
  title: { type: String, default: 'RIRI - Mata Air Permintaan' },
  isFullscreen: { type: [Boolean, Object], default: false },
  showUI: { type: [Boolean, Object], default: true },
  pdfLoading: { type: [Boolean, Object], default: false }
});

const emit = defineEmits(['toggleFullscreen']);

const shellRef = ref(null);

// Normalize incoming props that may be refs
const isFullscreen = computed(() => {
  const v = props.isFullscreen;
  return v && typeof v === 'object' && 'value' in v ? v.value : v;
});

const showUI = computed(() => {
  const v = props.showUI;
  return v && typeof v === 'object' && 'value' in v ? v.value : v;
});

// expose shellRef so parent can bind for fullscreen
defineExpose({ shellRef });
</script>

<template>
  <div ref="shellRef" class="viewer-shell">
    <div class="topbar" :class="{ hidden: !showUI }">
      <div class="title">{{ title }}</div>
      <button class="close-btn" aria-label="Toggle Fullscreen" @click="$emit('exitBook')">
        &#10005;
      </button>
    </div>

    <!-- Stage slot -->
    <slot name="stage"></slot>

    <!-- Controls slot -->
    <slot name="controls"></slot>

    <!-- Loading overlay shown while PDF is downloading/processing -->
    <div v-if="pdfLoading" class="loading-overlay" role="status" aria-live="polite">
      <div class="loading-card">
        <div class="spinner"></div>
        <div class="loading-text">Mengunduh dokumen... </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.viewer-shell {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  color: var(--text);
  overflow: hidden;
}

/* topbar that matches the screenshot: dark strip with subtle blur */
.topbar {
  height: 56px;
  background: linear-gradient(180deg, rgba(0,0,0,0.25), transparent);
  color: var(--text);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  backdrop-filter: blur(6px);
  transition: opacity 200ms ease, transform 200ms ease;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

/* title and controls */
.title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}
.close-btn {
  margin-left: auto;
  background: transparent;
  color: var(--muted);
  border: none;
  cursor: pointer;
  font-size: 20px;
  padding: 6px;
  border-radius: 8px;
}
.close-btn:hover {
  background: rgba(0,0,0,0.06);
  color: var(--accent);
}

.hidden {
  opacity: 0;
  pointer-events: none;
}

/* loading overlay card centered */
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--pdf-overlay);
  z-index: 30;
}
.loading-card {
  background: var(--card);
  color: var(--text);
  padding: 18px 22px;
  border-radius: 12px;
  box-shadow: var(--shadow);
  display: flex;
  gap: 12px;
  align-items: center;
}
.loading-card .spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 4px solid rgba(0,0,0,0.08);
  border-top-color: var(--accent);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
