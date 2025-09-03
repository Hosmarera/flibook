<template>
  <div class="w-full cursor-pointer card-root" @click="$emit('click', book)">
    <div class="relative rounded-t-xl overflow-hidden">
      <div class="thumb-wrap aspect-[4/3]">
        <img
          v-lazy="book.url_icon"
          :alt="book.title"
          class="w-full h-full object-cover"
        />
      </div>

      <span v-if="book.vip" class="vip-badge">VIP</span>
      <div v-if="book.locked" class="locked-overlay">🔒</div>
    </div>

    <p class="mt-2 book-title text-xs sm:text-sm font-medium leading-snug line-clamp-2">
      {{ book.title }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  book: { type: Object, required: true }
})
</script>

<style scoped>
.card-root {
  background: var(--card);
  box-shadow: var(--shadow);
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.06);
  position: relative;
  padding-bottom: 10px;
}

/* VIP badge */
.vip-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: linear-gradient(180deg, #ffd54f, #f7b500);
  color: #111;
  font-weight: 700;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.18);
  pointer-events: none;
}

/* optional locked overlay */
.locked-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0,0,0,0.45);
  color: #fff;
  padding: 4px 6px;
  border-radius: 8px;
  font-size: 12px;
}

/* Title styles */
.book-title {
  color: var(--text);
}

.card-root .book-title {
  padding-left: 5px;
  padding-right: 5px;
}

/* Clamp */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>