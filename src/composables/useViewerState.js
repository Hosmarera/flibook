import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { multiply, rotateY, perspective } from 'rematrix';
import { usePDF } from '@tato30/vue-pdf';

/**
 * useViewerState
 * Encapsulates PDF loading, layout, sizing, paging, zoom/pan basic state and flip animation state.
 *
 * This intentionally does NOT attach DOM event listeners — pointer & wheel handlers belong in usePointerPan.
 */
export function useViewerState(pdfUrl = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf') {
  // PDF
  const page = ref(1);
  const { pdf, pages } = usePDF(pdfUrl);

  // Orientation / device
  const orientation = ref('portrait');
  const devicePortrait = ref(false);
  const isMobile = computed(() => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 900);

  // PDF page native size
  const pdfPageWidth = ref(800);
  const pdfPageHeight = ref(1000);

  // base sizes (fit to stage)
  const baseWidth = ref(500);
  const baseHeight = ref(700);

  // transform state
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

  // UI hide timer
  const showUI = ref(true);
  let hideUiTimer = null;
  let lastTouchTime = 0;

  // element refs — injected into composables / components
  const stageRef = ref(null);
  const shellRef = ref(null);

  // sizing helpers
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

  function updateDimensions() {
    const isWide = window.innerWidth > window.innerHeight;
    devicePortrait.value = !isWide;
    orientation.value = isWide ? 'portrait' : 'landscape';
    fitBaseToStage();
  }

  // scaled sizes (memoized-ish)
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
    // defensively compute displayed pages so we never return an empty array
    const current = (page && page.value) ? page.value : 1;
    const total = (pages && pages.value) ? pages.value : 1;

    if (current <= 1) return [1];

    if (orientation.value === 'portrait') {
      const pagesToShow = [current];
      if (current + 1 <= total) {
        pagesToShow.push(current + 1);
      }
      return pagesToShow;
    }

    return [current];
  });

  // buffer pages memoization
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

    // reuse previous result if unchanged
    if (lastPage === page.value &&
      lastOrientation === orientation.value &&
      lastPages === pages.value &&
      lastBufferPages.length > 0 &&
      lastBufferPages[0] === start &&
      lastBufferPages[lastBufferPages.length - 1] === end) {
      return lastBufferPages;
    }

    const newBufferPages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    lastBufferPages = newBufferPages;
    lastPage = page.value;
    lastOrientation = orientation.value;
    lastPages = pages.value;

    return newBufferPages;
  });  

  // responsive spread helpers
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

  // flip animation state
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

  function prevPage() {
    page.value = Math.max(1, page.value - pageIncrement.value);
  }

  function nextPage() {
    page.value = Math.min(pages.value, page.value + pageIncrement.value);
  }

  // zoom controls
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

  // fullscreen
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

  function pdfLoaded(viewport) {
    if (viewport?.width && viewport?.height) {
      pdfPageWidth.value = viewport.width;
      pdfPageHeight.value = viewport.height;
    }
    applyResponsiveSpread();
    fitBaseToStage();
  }

  // UI hide scheduling (exposed so pointer composable can call from events)
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

  // cleanup
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

    // Store for cleanup
    window.__flibookResizeHandler = handleResize;
  });

  onUnmounted(() => {
    if (window.__flibookResizeHandler) {
      window.removeEventListener('resize', window.__flibookResizeHandler);
      delete window.__flibookResizeHandler;
    }

    if (hideUiTimer) {
      clearTimeout(hideUiTimer);
      hideUiTimer = null;
    }
  });

  return {
    // refs / computeds (return reactive values so consumers get reactivity)
    page,
    pdf,
    pages,
    pagesCount: pages,
    stageRef,
    shellRef,

    // orientation / sizing
    orientation,
    devicePortrait,
    isMobile,
    pdfPageWidth,
    pdfPageHeight,
    baseWidth,
    baseHeight,
    fitBaseToStage,
    updateDimensions,
    applyResponsiveSpread,

    // transforms
    zoomScale,
    panX,
    panY,
    isPanning,
    canPan,
    stageClasses,
    scaledWidth,
    scaledHeight,
    rotationStyle,
    frameTransform,
    flipOrigin,
    flipTransform,
    flipTransition,

    // paging
    pageIncrement,
    displayedPages,
    bufferPages,
    prevPage,
    nextPage,
    goToPage: (p) => { if (p == null || p === page.value) return; page.value = Math.max(1, Math.min(p, pages.value)); },

    // PDF handling
    pdfLoaded,

    // zoom & screen
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    isFullscreen,
    toggleFullscreen,

    // UI helpers
    showUI,
    scheduleHideUI,
    handleStageClick,

    // helpers used externally
    requestLandscapeIfNeeded,
  };
}
