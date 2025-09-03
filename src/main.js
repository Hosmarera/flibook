import { createApp } from 'vue'
import '@splidejs/vue-splide/css';

import './style.css'
import App from './App.vue'

import VueLazyload from 'vue-lazyload'
import router from './router'

createApp(App)
	.use(router)
	.use(VueLazyload, {
		loading: 'https://www.educastudio.com/new_template/img/placeholder-educa-2.png',
        error: 'https://www.educastudio.com/new_template/img/placeholder-educa-2.png'
	})
	.mount('#app')
