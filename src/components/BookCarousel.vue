<template>
	<div class="relative">
		<!-- Header -->
		<div class="flex justify-between items-center mb-2">
			<h2 class="text-white font-bold text-lg">{{ title }}</h2>
			<button class="bg-gray-700 text-white text-xs font-semibold px-3 py-1 rounded-full" @click="$emit('view-all')">
				Lihat Semua
			</button>
		</div>

		<!-- Carousel -->
		<div class="flex overflow-x-auto gap-3 no-scrollbar">
			<BookCard v-for="(book, index) in books" :key="index" :book="book" @click="$emit('book-click', book)" />
		</div>
	</div>
</template>

<script setup>
import BookCard from './BookCard.vue'

defineProps({
	title: { type: String, required: true },
	books: { type: Array, required: true }
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
	display: none;
}
</style>