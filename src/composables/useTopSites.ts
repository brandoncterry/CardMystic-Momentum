import { ref, onMounted } from 'vue'

export interface TopSite {
  title: string
  url: string
  favicon: string
}

export function useTopSites(maxSites = 8) {
  const sites = ref<TopSite[]>([])
  const isLoading = ref(true)

  onMounted(async () => {
    try {
      const raw = await chrome.topSites.get()
      sites.value = raw.slice(0, maxSites).map((site) => {
        const hostname = new URL(site.url).hostname
        return {
          title: site.title || hostname,
          url: site.url,
          favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
        }
      })
    } catch (e) {
      console.warn('[useTopSites] Failed to load top sites:', e)
      sites.value = []
    } finally {
      isLoading.value = false
    }
  })

  return { sites, isLoading }
}
