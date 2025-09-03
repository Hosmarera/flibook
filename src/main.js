import { createApp } from 'vue'
import '@splidejs/vue-splide/css';

import './style.css'
import App from './App.vue'

import router from './router'

createApp(App)
	.use(router)
	.mount('#app')
