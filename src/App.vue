<script setup>
</script>

<template>
  <router-view />
</template>

<style scoped>
/* App root now delegates to pages via vue-router */
:root { --bg: #111; }
html, body, #app { height: 100%; margin: 0; background: var(--bg); }
</style>
