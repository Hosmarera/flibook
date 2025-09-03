import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import BookPage from '../pages/BookPage.vue';

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/book/:id', name: 'book', component: BookPage, props: true },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;