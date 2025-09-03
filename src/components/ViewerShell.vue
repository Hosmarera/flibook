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
  background: #e8e8e8;
  overflow: hidden;
}
.topbar {
  height: 42px;
  background: #2b2b2b;
  color: #fff;
  display: flex;
  align-items: center;
  padding: 0 12px;
  transition: opacity 200ms ease, transform 200ms ease;
}
.title {
  font-size: 13px;
  font-weight: 600;
}
.close-btn {
  margin-left: auto;
  background: transparent;
  color: #cfcfcf;
  border: none;
  cursor: pointer;
  font-size: 16px;
}
.hidden {
  opacity: 0;
  pointer-events: none;
}
</style>
