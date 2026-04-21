import { ref, watch } from 'vue'
import type { ResolvedCard } from '../types'
import { favoritesStorage } from '../utils/storage'

export function useFavorites() {
  const favorites = ref<ResolvedCard[]>([])

  async function load() {
    const stored = await favoritesStorage.getValue()
    if (Array.isArray(stored)) {
      favorites.value = stored
    }
  }

  let saveTimeout: ReturnType<typeof setTimeout> | null = null
  function scheduleSave() {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(async () => {
      await favoritesStorage.setValue(favorites.value)
    }, 300)
  }

  watch(favorites, scheduleSave, { deep: true })

  function isFavorited(uuid: string): boolean {
    return favorites.value.some((c) => c.uuid === uuid)
  }

  function toggleFavorite(card: ResolvedCard): void {
    const index = favorites.value.findIndex((c) => c.uuid === card.uuid)
    if (index === -1) {
      favorites.value = [...favorites.value, card]
    } else {
      favorites.value = favorites.value.filter((c) => c.uuid !== card.uuid)
    }
  }

  load()

  return { favorites, isFavorited, toggleFavorite }
}
