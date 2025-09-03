<template>
	<div class="flex justify-center my-4" v-for="(ad, index) in ads" :key="index">
		<img :src="ad.url_image" class="rounded-lg max-h-48 w-auto" loading="lazy" @click="$emit('ads-click', ad)" />
	</div>
</template>

<script setup>
defineProps({
	ads: { type: Array, required: true }
})
</script>