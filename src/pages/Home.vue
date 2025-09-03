<template>
  <!-- app-shell uses CSS variables from App.vue to support light/dark -->
  <div class="app-shell min-h-screen p-3 sm:p-4 space-y-6 max-w-screen-sm mx-auto">
    <BannerSlider :banners="banners" @ads-click="handleAdsClick" />

    <template v-if="geolocationAllowed">
      <section v-for="(books, category, index) in groupedBooks" :key="category">
        <!-- Native Ads di tengah -->
        <NativeAd v-if="index === middleIndex" :ads="nativeAds" @ads-click="handleAdsClick" />

        <BookCarousel
          :books="books"
          :title="books?.[0]?.category_name || category"
          @book-click="handleBookClick"
          @view-all="() => handleViewAll(category)"
        />
      </section>
    </template>

    <div v-else class="text-center text-muted py-6">
      <h3>Akses Ditolak!</h3>
    </div>

    <InterstitialAd
      v-if="showInterstitial"
      :ad="interstitialAd"
      @skip="skipInterstitial"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BannerSlider from './../components/BannerSlider.vue'
import BookCarousel from './../components/BookCarousel.vue'
import NativeAd from './../components/NativeAd.vue'
import InterstitialAd from './../components/InterstitialAd.vue'
import {books} from './../data/books'

const groupedBooks = ref(books)
const internalAds = ref(null)
const geolocationAllowed = ref(true)
const showInterstitial = ref(false)
const interstitialAd = ref(null)

const banners = computed(() => {
  const arr = [{ id_unit: -1, url_image: 'https://www.educastudio.com/img/library/home-banner-v3.png' }]
  if (internalAds.value?.ads_campaign) {
    arr.push(...internalAds.value.ads_campaign.filter(ad => ad.name_unit.includes('feature_banner')))
  }
  return arr
})

const nativeAds = computed(() => internalAds.value?.ads_campaign?.filter(ad => ad.name_unit.includes('native')) || [])

const middleIndex = computed(() => Math.floor(Object.keys(groupedBooks.value).length / 2))

function handleBookClick(book) {
  if (book.vip) {
    alert('Konten VIP, silakan unduh aplikasi RIRI!')
    return
  }
  showInterstitial.value = true
  interstitialAd.value = { ...book }
}

function handleAdsClick(ad) {
  window.open(ad.url_redirect, '_blank')
}

import { useRouter } from 'vue-router'
const router = useRouter()

function handleViewAll(category) {
  router.push({ name: 'category', params: { id: category } })
}

function skipInterstitial() {
  showInterstitial.value = false
}

onMounted(async () => {
  // Ganti dengan API fetch asli
  const res = await fetch('/api/library/data')
  const data = await res.json()
  groupedBooks.value = data.groupedBooks
  internalAds.value = data.internalAds

  // Contoh: geolocation gating
  geolocationAllowed.value = true // (implementasi cek lokasi jika perlu)
})
</script>
