<script setup>
import { defineProps, defineEmits } from 'vue';
import { VuePDF } from '@tato30/vue-pdf';

const props = defineProps({
  pdf: { type: Object, required: true },
  page: { type: Number, required: true },
  width: { type: [Number, String], required: true },
  height: { type: [Number, String], required: true },
  watermarkSrc: { type: String, default: 'https://platform.educastudio.com/img/watermark_riri.png' }
});

const emit = defineEmits(['loaded']);
</script>

<template>
  <div class="pdf-frame-inner" :style="{ width: (width + 'px'), height: (height + 'px') }">
    <template v-if="pdf">
      <VuePDF :pdf="pdf" :page="page" :width="width" :height="height" @loaded="(v)=>emit('loaded', v)">
        <div class="pdf-loading">
          <span class="spinner"></span>
          <span>Memuat halaman...</span>
        </div>
      </VuePDF>
    </template>
    <template v-else>
      <div class="pdf-loading">
        <span class="spinner"></span>
        <span>Memuat dokumen...</span>
      </div>
    </template>

    <div class="wm-once">
      <img class="w-12 sm:w-16" :src="watermarkSrc" alt="watermark" />
    </div>
  </div>
</template>

<style>
.pdf-frame-inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wm-once {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0.4;
  pointer-events: none;
}
.pdf-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #444;
  font-size: 15px;
  background: rgba(255,255,255,0.85);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.pdf-loading .spinner {
  width: 32px;
  height: 32px;
  border: 4px solid #e0e0e0;
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  animation: pdf-spin 1s linear infinite;
  margin-bottom: 12px;
}
@keyframes pdf-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
