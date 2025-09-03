<template>
	<div class="relative">
		<!-- Header with controls aligned to right -->
		<div class="flex justify-between items-center mb-3">
			<h2 class="section-title font-bold text-lg">{{ title }}</h2>

			<div class="header-controls flex items-center gap-2">

				<!-- nav buttons live in header to align with "Lihat Semua" -->
				<button class="nav-btn small left" aria-label="Scroll left" @click="scroll(-0.5)" :disabled="!canScrollLeft"
					v-show="showNav">
					‹
				</button>

				<button class="nav-btn small right" aria-label="Scroll right" @click="scroll(0.5)" :disabled="!canScrollRight"
					v-show="showNav && !showLihatSemua">
					›
				</button>
				<!-- "Lihat Semua" is shown only when the carousel cannot scroll further right -->
				<button v-if="showLihatSemua" class="view-all-btn" @click="$emit('view-all')">Lihat Semua</button>
			</div>
		</div>

		<!-- Carousel track -->
		<div class="carousel-container rounded-xl p-0 relative" role="list">
			<div class="carousel-track flex overflow-x-auto gap-3 no-scrollbar" ref="track" @scroll="onScroll">
				<BookCard
					v-for="(book, index) in books"
					:key="index"
					:book="book"
					@click="$emit('book-click', book)"
					class="max-w-[9rem] min-w-[9rem] flex-shrink-0"
				/>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import BookCard from './BookCard.vue'

const props = defineProps({
	title: { type: String, required: true },
	books: { type: Array, required: true }
})

const track = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const showNav = ref(false)

function updateScrollState() {
	const el = track.value
	if (!el) {
		showNav.value = false
		canScrollLeft.value = false
		canScrollRight.value = false
		return
	}
	showNav.value = el.scrollWidth > el.clientWidth + 8
	canScrollLeft.value = el.scrollLeft > 8
	canScrollRight.value = (el.scrollLeft + el.clientWidth) < (el.scrollWidth - 8)
}

// scroll by ~75% of visible width
function scroll(dir = 1) {
	const el = track.value
	if (!el) return
	const amount = Math.round(el.clientWidth * 0.75) * dir
	el.scrollBy({ left: amount, behavior: 'smooth' })
	// small timeout to update state after scroll animation
	setTimeout(updateScrollState, 350)
}

function onScroll() {
	updateScrollState()
}

let ro = null
onMounted(() => {
	const el = track.value
	updateScrollState()
	if (!el) return
	ro = new ResizeObserver(updateScrollState)
	ro.observe(el)
	// also observe window in case layout changes outside the element
	window.addEventListener('resize', updateScrollState)
})
onBeforeUnmount(() => {
	if (ro && track.value) ro.unobserve(track.value)
	window.removeEventListener('resize', updateScrollState)
})

// show "Lihat Semua" when cannot scroll right further
const showLihatSemua = computed(() => !canScrollRight.value && !showNav.value ? false : !canScrollRight.value)
</script>

<style scoped>
.section-title {
	color: var(--text);
}

/* header controls (aligned to the same horizontal line as title) */
.header-controls {
	align-items: center;
}

/* "Lihat Semua" pill */
.view-all-btn {
	background: transparent;
	color: var(--muted);
	border: 1px solid rgba(255, 255, 255, 0.04);
	padding: 6px 10px;
	font-size: 12px;
	border-radius: 999px;
	cursor: pointer;
	transition: background 160ms ease, color 160ms ease, transform 160ms;
}

.view-all-btn:hover {
	background: rgba(0, 0, 0, 0.06);
	color: var(--accent);
	transform: translateY(-1px);
}

/* carousel container */
.carousel-container {
	background: transparent;
	position: relative;
	margin-top: 10px;
	/* padding: 6px 8px; */
}

/* track that holds cards */
.carousel-track {
	scroll-behavior: smooth;
	/* padding: 6px 8px; */
}

/* navigation buttons inside header */
.nav-btn.small {
	width: 34px;
	height: 34px;
	font-size: 18px;
	padding: 0;
	display: inline-grid;
	place-items: center;
	border-radius: 999px;
	border: none;
	background: var(--glass);
	color: var(--text);
	box-shadow: 0 6px 18px rgba(2, 6, 23, 0.12);
	cursor: pointer;
	transition: transform 120ms ease, opacity 120ms;
}

.nav-btn.small:disabled {
	opacity: 0.38;
	cursor: default;
}

.nav-btn.small.left {
	margin-left: 2px;
}

.nav-btn.small.right {
	margin-left: 4px;
}

/* hide native scrollbar for a cleaner look */
.no-scrollbar::-webkit-scrollbar {
	display: none;
}

/* ensure BookCard visual stands out */
::v-deep .card-root {
	background: var(--card);
	/* explicit shadow per request for identifiability */
	box-shadow: 0px 10px 20px rgba(30, 30, 30, 0.08);
	border-radius: 12px;
	overflow: hidden;
	border: 1px solid rgba(0, 0, 0, 0.06);
}
</style>