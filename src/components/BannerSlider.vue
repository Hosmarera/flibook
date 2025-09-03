<template>
	<Splide :options="{
		perPage: 1,
		perMove: 1,
		pagination: false,
		autoplay: true,
		interval: 5000,
		type: 'loop',
		arrows: false
	}" class="rounded-lg overflow-hidden">
		<SplideSlide v-for="(banner, index) in banners" :key="index" class="cursor-pointer">
			<img
				:src="banner.url_image"
				:alt="`Banner ${index}`"
				class="w-full aspect-[16/9] object-cover"
				loading="lazy"
				@click="$emit('ads-click', banner)" />
		</SplideSlide>
	</Splide>
</template>

<script setup>
import { Splide, SplideSlide } from '@splidejs/vue-splide'

defineProps({
	banners: { type: Array, required: true }
})
</script>

<style scoped>
.splide {
	border-radius: 12px;
}
</style>