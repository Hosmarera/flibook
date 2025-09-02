<template>
  <div class="flipbook-wrapper">
    <Flipbook
      v-if="!loading"
      class="flipbook"
      :pages="pages"
      :start-page="0"
      ref="flipbookRef"
      :drag="true"
    />
    <div v-if="loading" class="loading-indicator">
      <p>Preparing document...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { VuePdf } from '@tato30/vue-pdf';
import Flipbook from 'flipbook-vue';

const pdfSrc = 'https://www.antennahouse.com/hubfs/xsl-fo-sample/pdf/basic-link-1.pdf';
const pages = ref([]);
const loading = ref(true);
const numPages = ref(0);
const flipbookRef = ref(null);
let pdfDocument = null;
const renderedPages = new Set();

const createPlaceholderUrl = (width, height, pageNum) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.fillStyle = '#e0e0e0';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#333';
  context.font = '24px sans-serif';
  context.textAlign = 'center';
  context.fillText(`Page ${pageNum}`, width / 2, height / 2);
  return canvas.toDataURL();
};

onMounted(async () => {
  try {
    pdfDocument = await VuePdf.createApp({ url: pdfSrc }).promise;
    numPages.value = pdfDocument.numPages;

    const firstPage = await pdfDocument.getPage(1);
    const viewport = firstPage.getViewport({ scale: 1.5 });

    pages.value = Array.from({ length: numPages.value }, (_, i) =>
      createPlaceholderUrl(viewport.width, viewport.height, i + 1)
    );

    loading.value = false;

    // After flipbook is mounted, start rendering
    await renderPage(1);
    await renderPage(2);
  } catch (error) {
    console.error('Failed to load PDF:', error);
    loading.value = false;
  }
});

watch(() => flipbookRef.value?.page, (newPage) => {
  if (newPage === undefined) return;
  const pageNum = newPage + 1;
  // Pre-render nearby pages for a smoother experience
  renderPage(pageNum);
  renderPage(pageNum + 1);
  if (pageNum > 1) {
    renderPage(pageNum - 1);
  }
});

async function renderPage(pageNum) {
  if (pageNum < 1 || pageNum > numPages.value || renderedPages.has(pageNum)) {
    return;
  }
  renderedPages.add(pageNum);

  try {
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
    pages.value[pageNum - 1] = canvas.toDataURL();
  } catch (error) {
    console.error(`Failed to render page ${pageNum}:`, error);
    renderedPages.delete(pageNum); // Allow re-rendering on error
  }
}

const flipLeft = () => flipbookRef.value?.flipLeft();
const flipRight = () => flipbookRef.value?.flipRight();
const zoomIn = () => flipbookRef.value?.zoomIn();
const zoomOut = () => flipbookRef.value?.zoomOut();
const toggleFullscreen = () => flipbookRef.value?.toggleFullscreen();

defineExpose({
  flipLeft,
  flipRight,
  zoomIn,
  zoomOut,
  toggleFullscreen,
  flipbookRef,
});
</script>

<style scoped>
.flipbook-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.flipbook {
  width: 100%;
  height: 100%;
}
.loading-indicator {
  font-size: 1.5rem;
}
</style>
