import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'
import '../../assets/styles/main.css'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [{ path: '/', component: App }],
})

const app = createApp(App)
app.use(router)
app.use(ui)
app.mount('#app')
