<script setup>
import { ref, onMounted } from 'vue';
import { useViewerState } from './composables/useViewerState';
import { usePointerPan } from './composables/usePointerPan';
import ViewerShell from './components/ViewerShell.vue';
import Stage from './components/Stage.vue';
import ControlsBar from './components/ControlsBar.vue';

const state = useViewerState('/sample 1.pdf');

// Pointer / pan handlers (returns functions to bind to DOM events)
const { onPointerDown, onPointerMove, onPointerUp, handleZoomWheel } = usePointerPan({
  stageRef: state.stageRef,
  zoomScale: state.zoomScale,
  panX: state.panX,
  panY: state.panY,
  isPanning: state.isPanning,
  canPan: state.canPan,
  showUI: state.showUI,
  scheduleHideUI: state.scheduleHideUI,
  prevPage: state.prevPage,
  nextPage: state.nextPage,
});

const viewerShellRef = ref(null);

onMounted(() => {
  // wire shellRef from ViewerShell (ViewerShell exposes its internal shellRef)
  if (viewerShellRef.value && viewerShellRef.value.shellRef) {
    state.shellRef.value = viewerShellRef.value.shellRef.value;
  }
});

</script>

<template>
  <ViewerShell
    ref="viewerShellRef"
    :isFullscreen="state.isFullscreen"
    :showUI="state.showUI"
    @toggleFullscreen="state.toggleFullscreen"
  >
    <template #stage>
      <Stage
        :pdf="state.pdf.value"
        :buffer-pages="state.bufferPages.value"
        :displayed-pages="state.displayedPages.value"
        :scaled-width="state.scaledWidth.value"
        :scaled-height="state.scaledHeight.value"
        :frame-transform="state.frameTransform.value"
        :flip-origin="state.flipOrigin.value"
        :rotation-style="state.rotationStyle.value"
        :stage-classes="state.stageClasses.value"
        :stage-ref="state.stageRef"
        :showUI="state.showUI.value"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @wheel="handleZoomWheel"
        @stageClick="state.handleStageClick"
        @pageLoaded="state.pdfLoaded"
      />
    </template>

    <template #controls>
      <ControlsBar
        :page="state.page.value"
        :pages-count="state.pages.value"
        :is-first-page="state.page.value === 1"
        :is-last-page="state.page.value === state.pages.value"
        :zoom-scale="state.zoomScale.value"
        :showUI="state.showUI"
        @prev="state.prevPage"
        @next="state.nextPage"
        @zoomIn="state.zoomIn"
        @zoomOut="state.zoomOut"
        @fit="state.fitToScreen"
        @toggleFullscreen="state.toggleFullscreen"
      />
    </template>
  </ViewerShell>
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
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

</style>
