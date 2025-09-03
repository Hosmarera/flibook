<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BookCard from '../components/BookCard.vue'
import { books } from '../data/books'

const route = useRoute()
const router = useRouter()

const categoryId = computed(() => String(route.params.id || ''))
const categoryBooks = computed(() => books[categoryId.value] || [])
const categoryName = computed(() => {
  if (categoryBooks.value.length > 0) return categoryBooks.value[0].category_name || categoryId.value
  return categoryId.value
})

function handleBookClick(book) {
  // navigate to book page (existing route '/book/:id')
  // we pass the book.id (numeric string) — BookPage logic may expect other ids,
  // but this keeps navigation consistent with existing '/book/:id' route.
  router.push({ name: 'book', params: { id: book.id } })
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="page-shell min-h-screen p-4 max-w-screen-sm mx-auto">
    <div class="header flex items-center gap-3 mb-4">
      <button class="back-btn" @click="goBack">← Back</button>
      <h2 class="title text-lg font-semibold">{{ categoryName }}</h2>
      <span class="count ml-auto text-sm text-muted">{{ categoryBooks.length }} buku</span>
    </div>

    <div v-if="categoryBooks.length === 0" class="empty text-center py-8 text-muted">
      <p>Tidak ada buku di kategori ini.</p>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      <BookCard
        v-for="book in categoryBooks"
        :key="book.id"
        :book="book"
        @click="() => handleBookClick(book)"
      />
    </div>
  </div>
</template>

<style scoped>
.page-shell {
  color: var(--text);
  background: var(--bg);
}

.header .back-btn {
  background: transparent;
  border: 0;
  color: var(--text);
  font-weight: 600;
  cursor: pointer;
}

.title {
  margin: 0;
}

.count {
  color: rgba(0,0,0,0.45);
}

/* simple responsive tweaks */
@media (min-width: 640px) {
  .grid { grid-template-columns: repeat(4, minmax(0,1fr)); }
}
</style>