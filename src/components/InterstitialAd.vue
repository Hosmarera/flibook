<template>
	<div class="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
		<img :src="ad.url_image" alt="Interstitial Ad" class="max-w-full max-h-screen" />
		<button class="mt-4 bg-white text-black rounded px-4 py-2 font-bold" @click="$emit('skip')">
			Skip
		</button>
	</div>
</template>

<script setup>
defineProps({
	ad: { type: Object, required: true }
})
</script>