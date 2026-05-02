import { defineConfig } from 'wxt'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'CardMystic Companion — MTG Art New Tab',
    description:
      'Replace your new tab with stunning Magic: The Gathering card art.',
    permissions: ['storage', 'topSites', 'alarms'],
    host_permissions: [
      'https://cardmystic-companion-api.cardmystic-companion.workers.dev/*',
      'https://pub-7b17b8297065456094ad110fe94cabe0.r2.dev/*',
    ],
  },
  vite: () => ({
    plugins: [ui()],
  }),
})
