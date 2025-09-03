<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import PdfFrame from './PdfFrame.vue';

const props = defineProps({
  pdf: { type: Object, required: true },
  bufferPages: { type: Array, required: true },
  displayedPages: { type: Array, required: true },
  scaledWidth: { type: [Number, String], required: true },
  scaledHeight: { type: [Number, String], required: true },
  frameTransform: { type: String, default: '' },
  flipOrigin: { type: String, default: 'center center' },
  rotationStyle: { type: Object, default: () => ({}) },
  stageClasses: { type: Object, default: () => ({}) },
  stageRef: { type: Object, required: true },
  showUI: { type: Boolean, default: true }
});

const emit = defineEmits([
  'pageLoaded',
  'stageClick',
  'pointerdown',
  'pointermove',
  'pointerup',
  'wheel'
]);

/* Robust normalization to accept plain arrays, refs, computed refs, iterables, or a single number.
   This prevents empty-array cases when a reactive/proxied array is passed. */
function extractValue(maybeRef) {
  // If it's a ref/computed, use .value; otherwise use as-is
  if (maybeRef && Object.prototype.hasOwnProperty.call(maybeRef, 'value')) {
    return maybeRef.value;
  }
  return maybeRef;
}

const normalizedDisplayedPages = computed(() => {
  const raw = extractValue(props.displayedPages);
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'number') return [raw];
  if (typeof raw[Symbol.iterator] === 'function') {
    try { return Array.from(raw); } catch { return []; }
  }
  return [];
});

const normalizedBufferPages = computed(() => {
  const raw = extractValue(props.bufferPages);
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'number') return [raw];
  if (typeof raw[Symbol.iterator] === 'function') {
    try { return Array.from(raw); } catch { return []; }
  }
  return [];
});

const normalizedScaledWidth = computed(() => {
  const v = extractValue(props.scaledWidth);
  return v != null ? v : 0;
});

const normalizedScaledHeight = computed(() => {
  const v = extractValue(props.scaledHeight);
  return v != null ? v : 0;
});

function onLoaded(payload) {
  emit('pageLoaded', payload);
}

</script>

<template>
  <div
    v-bind:ref="stageRef"
    class="stage"
    :class="stageClasses"
    @click="(e)=>emit('stageClick', e)"
    @mousedown.stop="(e)=>emit('pointerdown', e)"
    @mousemove="(e)=>emit('pointermove', e)"
    @mouseup="(e)=>emit('pointerup', e)"
    @mouseleave="(e)=>emit('pointerup', e)"
    @touchstart="(e)=>emit('pointerdown', e)"
    @touchmove.prevent="(e)=>emit('pointermove', e)"
    @touchend.passive="(e)=>emit('stageClick', e)"
    @touchcancel.passive="(e)=>emit('pointerup', e)"
    @wheel.prevent="(e)=>emit('wheel', e)"
  >
    <div class="rotation-wrapper" :style="rotationStyle">
      <div class="pdf-frame" :style="{ transform: frameTransform, transformOrigin: flipOrigin }">
        <template v-for="p in normalizedBufferPages" :key="p">
          <div class="page-wrap" v-show="normalizedDisplayedPages.includes(p)">
            <PdfFrame :pdf="pdf" :page="p" :width="normalizedScaledWidth" :height="normalizedScaledHeight" @loaded="onLoaded" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  contain: layout paint;
}
.stage.can-pan { cursor: grab; }
.stage.is-panning { cursor: grabbing; }
.stage.is-mobile { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }

.rotation-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
}

.pdf-frame {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  will-change: transform;
  backface-visibility: hidden;
}

.page-wrap {
  position: relative;
}
</style>
