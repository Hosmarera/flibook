<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  page: { type: Number, required: true },
  pagesCount: { type: Number, required: true },
  isFirstPage: { type: Boolean, default: false },
  isLastPage: { type: Boolean, default: false },
  zoomScale: { type: Number, default: 1 },
  showUI: { type: [Boolean, Object], default: true },
});

const showUI = computed(() => {
  const v = props.showUI;
  return v && typeof v === 'object' && 'value' in v ? v.value : v;
});

const emit = defineEmits(['prev', 'next', 'zoomIn', 'zoomOut', 'fit', 'toggleFullscreen']);
</script>

<template>
  <div class="bottombar" :class="{ hidden: !showUI }">
    <button class="icon" @click="$emit('prev')" :disabled="isFirstPage">‹</button>
    <span class="page-indicator">{{ page }}/{{ pagesCount }}</span>
    <button class="icon" @click="$emit('next')" :disabled="isLastPage">›</button>

    <div class="spacer"></div>

    <button class="icon" @click="$emit('zoomOut')">−</button>
    <button class="icon" @click="$emit('zoomIn')">＋</button>
    <button class="icon" @click="$emit('fit')">Fit</button>
    <button class="icon" @click="$emit('toggleFullscreen')">⤢</button>
  </div>
</template>

<style scoped>
.bottombar {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: #2b2b2b;
  color: #fff;
  transition: opacity 200ms ease, transform 200ms ease;
}
.icon {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 6px 10px;
  margin-right: 8px;
  border-radius: 4px;
  cursor: pointer;
}
.icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-indicator {
  font-size: 13px;
  margin: 0 6px;
}
.spacer { flex: 1; }
.hidden { opacity: 0; pointer-events: none; }
</style>
