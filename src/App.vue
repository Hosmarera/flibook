<script setup>
import { multiply, rotateY, perspective } from 'rematrix'
import { VuePDF, usePDF } from '@tato30/vue-pdf';
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';

const page = ref(1);
const pdfDocument = usePDF('https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf');
// const pdfDocument = usePDF('https://is3.cloudhost.id/platform/kabi-ebook/asset-pdf-KABU0076-20250107-140621.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=V0ZBXRJLB4I1NBITOCMU%2F20250902%2Fdefault%2Fs3%2Faws4_request&X-Amz-Date=20250902T110815Z&X-Amz-Expires=14400&X-Amz-Signature=bb421b8dc47c0a2ed0c930d9565f17160d98bc9b8f8a449c738f46288813df09&X-Amz-SignedHeaders=host');
// const pdfDocument = usePDF('/sample 1.pdf');

const { pdf, pages } = pdfDocument;

const orientation = ref('portrait');
const devicePortrait = ref(false);
const isMobile = computed(() => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 900);
const pdfPageWidth = ref(800);
const pdfPageHeight = ref(1000);

const baseWidth = ref(500);
const baseHeight = ref(700);
const zoomScale = ref(1);
const panX = ref(0);
const panY = ref(0);
const isPanning = ref(false);
const canPan = computed(() => zoomScale.value > 1);
const stageClasses = computed(() => ({
  'can-pan': canPan.value,
  'is-panning': isPanning.value,
  'is-mobile': isMobile.value
}));

const showUI = ref(true);
let hideUiTimer = null;
let lastTouchTime = 0;

function updateDimensions() {
  const isWide = window.innerWidth > window.innerHeight;
  devicePortrait.value = !isWide;
  orientation.value = isWide ? 'portrait' : 'landscape';
  fitBaseToStage();
}

function fitBaseToStage() {
  const stage = stageRef.value;
  const stageWidth = Math.max(1, stage?.clientWidth || window.innerWidth);
  const stageHeight = Math.max(1, stage?.clientHeight || window.innerHeight);
  const pageAspect = pdfPageWidth.value && pdfPageHeight.value
    ? pdfPageWidth.value / pdfPageHeight.value
    : 0.8;

  const padding = 24;
  const usableWidth = stageWidth - padding;
  const usableHeight = stageHeight - padding;

  const pagesOnScreen = orientation.value === 'portrait' ? 2 : 1;
  const perPageMaxWidth = (usableWidth - (pagesOnScreen === 2 ? 16 : 0)) / pagesOnScreen;
  const perPageMaxHeight = usableHeight;

  const widthByHeight = perPageMaxHeight * pageAspect;
  const heightByWidth = perPageMaxWidth / pageAspect;

  const fitWidth = Math.min(perPageMaxWidth, widthByHeight);
  const fitHeight = Math.min(perPageMaxHeight, heightByWidth);

  baseWidth.value = Math.floor(fitWidth);
  baseHeight.value = Math.floor(fitHeight);
}

onMounted(() => {
  updateDimensions();

  // Debounced resize handler
  let resizeTimeout;
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateDimensions();
      requestLandscapeIfNeeded();
      applyResponsiveSpread();
      fitBaseToStage();
    }, 100);
  };

  window.addEventListener('resize', handleResize);
  requestLandscapeIfNeeded();
  scheduleHideUI();

  // Store the resize handler for cleanup
  window.__flibookResizeHandler = handleResize;
});

onUnmounted(() => {
  // Clean up event listeners and timers
  if (window.__flibookResizeHandler) {
    window.removeEventListener('resize', window.__flibookResizeHandler);
    delete window.__flibookResizeHandler;
  }

  if (hideUiTimer) {
    clearTimeout(hideUiTimer);
    hideUiTimer = null;
  }
});

// Memoized scaled dimensions
let lastScaledWidth = 0;
let lastScaledHeight = 0;
let lastBaseWidth = 0;
let lastBaseHeight = 0;
let lastZoomScale = 0;

const scaledWidth = computed(() => {
  const width = Math.floor(baseWidth.value * zoomScale.value);
  if (lastBaseWidth === baseWidth.value &&
    lastZoomScale === zoomScale.value &&
    lastScaledWidth === width) {
    return lastScaledWidth;
  }
  lastBaseWidth = baseWidth.value;
  lastZoomScale = zoomScale.value;
  lastScaledWidth = width;
  return width;
});

const scaledHeight = computed(() => {
  const height = Math.floor(baseHeight.value * zoomScale.value);
  if (lastBaseHeight === baseHeight.value &&
    lastZoomScale === zoomScale.value &&
    lastScaledHeight === height) {
    return lastScaledHeight;
  }
  lastBaseHeight = baseHeight.value;
  lastZoomScale = zoomScale.value;
  lastScaledHeight = height;
  return height;
});

const rotationStyle = computed(() => {
  if (!devicePortrait.value) return {};
  return {
    width: '100vh',
    height: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'rotate(90deg)',
    transformOrigin: 'center center'
  };
});

const pageIncrement = computed(() => {
  return orientation.value === 'portrait' ? 2 : 1;
});

const displayedPages = computed(() => {
  if (page.value === 1) return [1];
  if (orientation.value === 'portrait') {
    const pagesToShow = [page.value];
    if (page.value + 1 <= pages.value) {
      pagesToShow.push(page.value + 1);
    }
    return pagesToShow;
  }
  return [page.value];
});

const pdfLoaded = (viewport) => {
  if (viewport?.width && viewport?.height) {
    pdfPageWidth.value = viewport.width;
    pdfPageHeight.value = viewport.height;
  }
  applyResponsiveSpread();
  fitBaseToStage();
};

function prevPage() {
  page.value = Math.max(1, page.value - pageIncrement.value);
}

function nextPage() {
  page.value = Math.min(pages.value, page.value + pageIncrement.value);
}

// Memoized buffer pages to reduce array creation
let lastBufferPages = [];
let lastPage = 0;
let lastOrientation = '';
let lastPages = 0;

const bufferPages = computed(() => {
  const displayed = displayedPages.value;
  if (!displayed.length) return [];

  const minPage = Math.min(...displayed);
  const maxPage = Math.max(...displayed);

  const start = Math.max(1, minPage - (pageIncrement.value + 1));
  const end = Math.min(pages.value, maxPage + (pageIncrement.value + 1));

  // Check if we can reuse the previous result
  if (lastPage === page.value &&
    lastOrientation === orientation.value &&
    lastPages === pages.value &&
    lastBufferPages.length > 0 &&
    lastBufferPages[0] === start &&
    lastBufferPages[lastBufferPages.length - 1] === end) {
    return lastBufferPages;
  }

  // Create new array
  const newBufferPages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  // Cache for next time
  lastBufferPages = newBufferPages;
  lastPage = page.value;
  lastOrientation = orientation.value;
  lastPages = pages.value;

  return newBufferPages;
});

function responsiveSinglePage() {
  const stage = stageRef.value;
  const deviceWidth = stage ? stage.clientWidth : window.innerWidth;
  const deviceHeight = stage ? stage.clientHeight : window.innerHeight;
  let deviceRatio = deviceWidth / Math.max(1, deviceHeight);
  if (deviceRatio < 1) deviceRatio = deviceHeight / Math.max(1, deviceWidth);

  const contentRatio = pdfPageWidth.value / Math.max(1, pdfPageHeight.value);
  const squareTolerance = 0.4;
  const squareMin = 1 - squareTolerance;
  const squareMax = 1 + squareTolerance;

  const isContentNearlySquare = contentRatio >= squareMin && contentRatio <= squareMax;
  const isDeviceNearlySquare = deviceRatio >= squareMin && deviceRatio <= squareMax;

  return isContentNearlySquare && isDeviceNearlySquare ? true : !isContentNearlySquare;
}

function applyResponsiveSpread() {
  const isSingle = responsiveSinglePage();
  orientation.value = isSingle ? 'landscape' : 'portrait';
}

const flipTransform = ref('none');
const flipTransition = ref('transform 0.6s ease');
const flipOrigin = ref('center center');

const frameTransform = computed(() => {
  return `translate(${panX.value}px, ${panY.value}px)`;
});

watch(page, async (newPage, oldPage) => {
  const direction = newPage > oldPage ? 1 : -1;
  if (orientation.value === 'portrait') {
    flipOrigin.value = direction > 0 ? 'left center' : 'right center';
  } else {
    flipOrigin.value = 'center center';
  }
  flipTransition.value = 'transform 0.6s ease';
  flipTransform.value = multiply(perspective(1000), rotateY(90 * direction)).toString();
  await new Promise(resolve => setTimeout(resolve, 300));
  flipTransform.value = multiply(perspective(1000), rotateY(0)).toString();
});

function zoomIn() {
  zoomScale.value = Math.min(2.5, +(zoomScale.value + 0.1).toFixed(2));
}
function zoomOut() {
  zoomScale.value = Math.max(0.5, +(zoomScale.value - 0.1).toFixed(2));
}
function resetZoom() {
  zoomScale.value = 1;
  panX.value = 0;
  panY.value = 0;
}

const shellRef = ref(null);
const isFullscreen = ref(false);
async function toggleFullscreen() {
  const el = shellRef.value;
  if (!el) return;
  if (!document.fullscreenElement) {
    await el.requestFullscreen?.();
    isFullscreen.value = true;
    await tryLockLandscape();
  } else {
    await document.exitFullscreen?.();
    isFullscreen.value = false;
  }
}

function fitToScreen() {
  updateDimensions();
  resetZoom();
}

// Panning
const stageRef = ref(null);
let startClientX = 0;
let startClientY = 0;
let startPanX = 0;
let startPanY = 0;
let initialDistance = 0;
let initialZoom = 1;

function onPointerDown(e) {
  const isPinchGesture = e.touches && e.touches.length === 2;

  if (isPinchGesture) {
    e.preventDefault();

    const [touch1, touch2] = e.touches;
    initialDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    initialZoom = zoomScale.value;
    isPanning.value = false; // disable pan while pinch zooming
    return;
  }

  if (!canPan.value) return;

  e.preventDefault();
  isPanning.value = true;
  startClientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  startClientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  startPanX = panX.value;
  startPanY = panY.value;
}

function onPointerMove(e) {
  // --- Pinch zoom ---
  if (e.touches && e.touches.length === 2) {
    e.preventDefault();

    const [touch1, touch2] = e.touches;
    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );

    if (initialDistance > 0) {
      const zoomFactor = currentDistance / initialDistance;
      const newZoom = Math.min(Math.max(initialZoom * zoomFactor, 1), 3);

      // Midpoint between fingers
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;
      const rect = stageRef.value.getBoundingClientRect();
      const mouseX = midX - rect.left;
      const mouseY = midY - rect.top;

      // Adjust pan so zoom focuses on pinch center
      const currentZoom = zoomScale.value;
      panX.value = mouseX - (mouseX - panX.value) * (newZoom / currentZoom);
      panY.value = mouseY - (mouseY - panY.value) * (newZoom / currentZoom);

      zoomScale.value = newZoom;
      showUI.value = true;
      scheduleHideUI();
    }
    return;
  }

  // --- Panning ---
  if (!isPanning.value) return;

  e.preventDefault();
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

  panX.value = startPanX + (clientX - startClientX);
  panY.value = startPanY + (clientY - startClientY);
}

function onPointerUp() {
  isPanning.value = false;
  initialDistance = 0; // reset pinch state
}


function scheduleHideUI() {
  clearTimeout(hideUiTimer);
  hideUiTimer = setTimeout(() => { showUI.value = false; }, 2500);
}

function handleStageClick(e) {
  if (e.type === 'click' && Date.now() - lastTouchTime < 400) return;
  if (e.type === 'touchend') lastTouchTime = Date.now();
  const stage = stageRef.value;
  if (!stage) return;
  const rect = stage.getBoundingClientRect();
  const clientX = e.changedTouches?.[0]?.clientX ?? e.touches?.[0]?.clientX ?? e.clientX;
  const x = clientX - rect.left;
  const leftZone = rect.width * 0.2;
  const rightZone = rect.width * 0.8;
  if (x < leftZone) {
    prevPage();
    return;
  }
  if (x > rightZone) {
    nextPage();
    return;
  }
  showUI.value = !showUI.value;
  if (showUI.value) scheduleHideUI();
}

async function tryLockLandscape() {
  try {
    if ('orientation' in screen && screen.orientation?.lock) {
      await screen.orientation.lock('landscape');
    }
  } catch (_) { }
}

async function requestLandscapeIfNeeded() {
  if (!isMobile.value || !devicePortrait.value) return;
  await tryLockLandscape();
}

const handleZoomWheel = (e) => {
  e.preventDefault();
  const delta = -e.deltaY;
  const zoomFactor = delta > 0 ? 1.1 : 0.9;
  const newZoom = zoomScale.value * zoomFactor;

  // Limit zoom range
  zoomScale.value = Math.min(Math.max(newZoom, 1), 3);

  // Center zoom on mouse position
  if (zoomScale.value > 1) {
    const stage = stageRef.value;
    const rect = stage.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate new pan position to keep content under mouse stable
    panX.value = mouseX - (mouseX - panX.value) * zoomFactor;
    panY.value = mouseY - (mouseY - panY.value) * zoomFactor;
  } else {
    // Reset pan when zoomed all the way out
    panX.value = 0;
    panY.value = 0;
  }

  showUI.value = true;
  scheduleHideUI();
}

</script>

<template>
  <div ref="shellRef" class="viewer-shell">
    <div class="topbar" :class="{ hidden: !showUI }">
      <div class="title">RIRI - Mata Air Permintaan</div>
      <button class="close-btn" aria-label="Close" @click="toggleFullscreen">{{ isFullscreen ? '⤢' : '⤢' }}</button>
    </div>

    <div ref="stageRef" class="stage" :class="stageClasses" @click="handleStageClick" @mousedown.stop="onPointerDown"
      @mousemove="onPointerMove" @mouseup="onPointerUp" @mouseleave="onPointerUp" @touchstart="onPointerDown"
      @touchmove.prevent="onPointerMove" @touchend.passive="handleStageClick" @touchcancel.passive="onPointerUp"
      @wheel.prevent="handleZoomWheel">

      <div class="rotation-wrapper" :style="rotationStyle">
        <div class="pdf-frame" :style="{ transform: frameTransform, transformOrigin: flipOrigin }">
          <template v-for="p in bufferPages" :key="p">
            <div class="page-wrap" v-show="displayedPages.includes(p)">
              <VuePDF :pdf="pdf" :page="p" :width="scaledWidth" :height="scaledHeight" @loaded="pdfLoaded">
                <div class="pdf-loading">
                  <span class="spinner"></span>
                  <span>Memuat halaman...</span>
                </div>
              </VuePDF>
              <div class="wm-once">
                <img class="w-16" src="https://platform.educastudio.com/img/watermark_riri.png" alt="watermark">
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div class="bottombar" :class="{ hidden: !showUI }">
      <button class="icon" @click="prevPage" :disabled="page === 1">‹</button>
      <span class="page-indicator">{{ page }}/{{ pages }}</span>
      <button class="icon" @click="nextPage" :disabled="page === pages">›</button>

      <div class="spacer"></div>

      <button class="icon" @click="zoomOut">−</button>
      <button class="icon" @click="zoomIn">＋</button>
      <button class="icon" @click="fitToScreen">Fit</button>
      <button class="icon" @click="toggleFullscreen">⤢</button>
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

.stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  /* IMPORTANT: Disable scrollbars */
  position: relative;
  contain: layout paint;
}

.stage.can-pan {
  cursor: grab;
}

.stage.is-panning {
  cursor: grabbing;
}

.stage.is-mobile {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

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
  /* So it can move with transform */
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  will-change: transform;
  backface-visibility: hidden;
}

.page-wrap {
  position: relative;
}

.wm-once {
  position: absolute;
  top: 20px;
  right: 12px;
  opacity: 0.4;
  pointer-events: none;
}

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

.spacer {
  flex: 1;
}

.hidden {
  opacity: 0;
  pointer-events: none;
}

.pdf-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: #444;
  font-size: 15px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
