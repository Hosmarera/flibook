<template>
	<div class="flex justify-between items-center mb-2">
		<h2 class="text-white font-bold text-lg">{{ title }}</h2>
		<div class="flex space-x-2">
			<button @click="$emit('prev')" class="bg-gray-700 rounded-full p-2">←</button>
			<button @click="$emit('next')" class="bg-gray-700 rounded-full p-2">→</button>
		</div>
	</div>
</template>

<script setup>
defineProps({
	title: { type: String, required: true }
});
</script>