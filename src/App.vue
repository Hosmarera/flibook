<script setup>
</script>

<template>
  <router-view />
</template>

<style>
/* Theme variables with OS preference support */
:root {
  color-scheme: light dark;

  /* Light theme defaults */
  --bg: #f3f4f6;
  --surface: #ffffff;
  --card: #ffffff;
  --muted: #6b7280;
  --text: #111827;
  --accent: #111827;
  --shadow: 0 6px 18px rgba(16,24,40,0.12);
  --glass: rgba(255,255,255,0.6);
  --pdf-overlay: rgba(255,255,255,0.9);
}

/* Dark theme */
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0b0b0b;
    --surface: #0f1720;
    --card: #252A2E; /* Updated per request - darker card background */
    --muted: #9ca3af;
    --text: #f9fafb;
    --accent: #f9fafb;
    --shadow: 0 10px 30px rgba(2,6,23,0.6);
    --glass: rgba(10,11,13,0.6);
    --pdf-overlay: rgba(0,0,0,0.65);
  }
}

/* App-level base styles */
html, body, #app {
  min-height: 100%;
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Utility to help pages center inside small-device max-width similar to screenshot */
.app-shell {
  min-height: 100vh;
  background: var(--bg);
}
</style>
