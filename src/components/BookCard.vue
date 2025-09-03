<template>
	<div class="flex-shrink-0 w-32 sm:w-36 cursor-pointer" @click="$emit('click', book)">
		<div class="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-800">
			<img :src="book.url_icon" :alt="book.title" class="w-full h-full object-cover" loading="lazy" />
			<span v-if="book.vip"
				class="absolute top-1 left-1 bg-yellow-400 text-xs font-semibold text-black px-2 py-0.5 rounded-full">
				VIP
			</span>
		</div>
		<p class="mt-2 text-white text-xs sm:text-sm font-medium leading-snug line-clamp-2">
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
.line-clamp-2 {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
</style>