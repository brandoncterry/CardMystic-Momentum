import { defineConfig } from 'wxt'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'Arcane Tab — MTG Art New Tab',
    description:
      'Replace your new tab with stunning Magic: The Gathering card art.',
    permissions: ['storage', 'topSites'],
  },
  vite: () => ({
    plugins: [ui()],
  }),
})
