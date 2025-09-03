import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import BookPage from '../pages/BookPage.vue';
import CategoryPage from '../pages/CategoryPage.vue';
 
const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/book/:id', name: 'book', component: BookPage, props: true },
  { path: '/book/category/:id', name: 'category', component: CategoryPage, props: true },
];
 
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // if the browser provides a saved position (back/forward), use it
    if (savedPosition) return savedPosition;
    // otherwise scroll to top on every navigation
    return { left: 0, top: 0 };
  }
});
 
export default router;