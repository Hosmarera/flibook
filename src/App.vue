<template>
  <div id="app" :class="{ 'dark-mode': isDarkMode }">
    <header class="app-header">
      <h1>PDF Flipbook Viewer</h1>
      <button @click="toggleDarkMode" class="btn theme-toggle">
        {{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}
      </button>
    </header>
    <main class="main-content">
      <FlipbookViewer ref="flipbookViewer" />
    </main>
    <footer class="app-footer">
      <div class="controls">
        <button @click="flipbookViewer?.zoomIn()" class="btn">Zoom In</button>
        <button @click="flipbookViewer?.zoomOut()" class="btn">Zoom Out</button>
        <button @click="flipbookViewer?.flipLeft()" class="btn">Prev</button>
        <span class="page-indicator">Page {{ currentPage }} of {{ totalPages }}</span>
        <button @click="flipbookViewer?.flipRight()" class="btn">Next</button>
        <button @click="flipbookViewer?.toggleFullscreen()" class="btn">Fullscreen</button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import FlipbookViewer from './components/FlipbookViewer.vue';

const flipbookViewer = ref(null);
const isDarkMode = ref(false);

const currentPage = computed(() => {
  const page = flipbookViewer.value?.flipbookRef?.page;
  return page !== undefined ? page + 1 : 0;
});

const totalPages = computed(() => {
  return flipbookViewer.value?.flipbookRef?.numPages || 0;
});

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  document.body.classList.toggle('dark-mode', isDarkMode.value);
};
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.main-content {
  flex-grow: 1;
  overflow: hidden;
}

.app-footer {
  padding: 0.5rem 1rem;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.btn {
  background-color: var(--btn-bg);
  color: var(--btn-text);
  border: 1px solid var(--border-color);
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: var(--btn-hover-bg);
}

.page-indicator {
  font-variant-numeric: tabular-nums;
}
</style>
