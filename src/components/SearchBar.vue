<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

defineProps<{
  visible: boolean
}>()

type SearchProvider = 'google' | 'cardmystic' | 'wiki'

const query = ref('')
const activeProvider = ref<SearchProvider>('google')
const inputRef = ref<HTMLInputElement>()

// Scryfall autocomplete
const suggestions = ref<string[]>([])
const showSuggestions = ref(false)
const selectedSuggestionIndex = ref(-1)
let abortController: AbortController | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const placeholder = computed(() => {
  switch (activeProvider.value) {
    case 'google':
      return 'Search Google or type a URL'
    case 'cardmystic':
      return 'Search cards or type a card name'
    case 'wiki':
      return 'Search MTG Wiki'
  }
})

const providers: { id: SearchProvider; label: string; icon: string }[] = [
  { id: 'google', label: 'Google', icon: 'i-heroicons-magnifying-glass' },
  { id: 'cardmystic', label: 'CardMystic', icon: 'i-heroicons-sparkles' },
  { id: 'wiki', label: 'Wiki', icon: 'i-heroicons-book-open' },
]

function selectProvider(id: SearchProvider) {
  activeProvider.value = id
  suggestions.value = []
  showSuggestions.value = false
  selectedSuggestionIndex.value = -1
  inputRef.value?.focus()
}

async function fetchSuggestions(q: string) {
  if (abortController) abortController.abort()
  if (q.length < 2) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }

  abortController = new AbortController()
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(q)}`,
      { signal: abortController.signal },
    )
    if (res.ok) {
      const data = await res.json()
      suggestions.value = (data.data as string[]).slice(0, 6)
      showSuggestions.value = suggestions.value.length > 0
      selectedSuggestionIndex.value = -1
    }
  } catch {
    // aborted or network error — ignore
  }
}

watch(query, (q) => {
  if (activeProvider.value !== 'cardmystic') {
    suggestions.value = []
    showSuggestions.value = false
    return
  }
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchSuggestions(q.trim()), 200)
})

function isCardName(q: string): boolean {
  // If the query exactly matches a suggestion, it's a card name
  return suggestions.value.some(
    (s) => s.toLowerCase() === q.toLowerCase(),
  )
}

function handleSearch() {
  const q = query.value.trim()
  if (!q) return

  switch (activeProvider.value) {
    case 'google': {
      const isUrl =
        /^https?:\/\//i.test(q) || (/\.\w+/.test(q) && !/\s/.test(q))
      if (isUrl) {
        window.location.href = q.startsWith('http') ? q : `https://${q}`
      } else {
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(q)}`
      }
      break
    }
    case 'cardmystic': {
      if (isCardName(q)) {
        window.location.href = `https://cardmystic.com/search/all/similarity?card_name=${encodeURIComponent(q)}&searchType=similarity`
      } else {
        window.location.href = `https://cardmystic.com/search/all/ai?query=${encodeURIComponent(q)}&searchType=ai`
      }
      break
    }
    case 'wiki': {
      window.location.href = `https://mtg.wiki/index.php?search=${encodeURIComponent(q)}&title=Special%3ASearch&go=Go`
      break
    }
  }
}

function selectSuggestion(name: string) {
  query.value = name
  showSuggestions.value = false
  selectedSuggestionIndex.value = -1
  inputRef.value?.focus()
}

function onKeydown(e: KeyboardEvent) {
  if (!showSuggestions.value) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedSuggestionIndex.value = Math.min(
      selectedSuggestionIndex.value + 1,
      suggestions.value.length - 1,
    )
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedSuggestionIndex.value = Math.max(
      selectedSuggestionIndex.value - 1,
      -1,
    )
  } else if (e.key === 'Enter' && selectedSuggestionIndex.value >= 0) {
    e.preventDefault()
    selectSuggestion(suggestions.value[selectedSuggestionIndex.value])
  } else if (e.key === 'Escape') {
    showSuggestions.value = false
    selectedSuggestionIndex.value = -1
  }
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.search-bar-container')) {
    showSuggestions.value = false
  }
}

onMounted(() => {
  inputRef.value?.focus()
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<template>
  <div v-if="visible" class="w-full max-w-[584px] mt-6 search-bar-container">
    <!-- Search bar -->
    <form @submit.prevent="handleSearch">
      <div
        class="relative flex items-center gap-3 rounded-full bg-black/30 backdrop-blur-md border border-white/20 px-5 py-3 transition-colors focus-within:bg-black/40 focus-within:border-white/30"
        :class="{ 'rounded-b-none rounded-t-2xl': showSuggestions }"
      >
        <UIcon
          name="i-heroicons-magnifying-glass"
          class="text-white/50 text-lg shrink-0"
        />
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          :placeholder="placeholder"
          class="flex-1 bg-transparent text-white placeholder-white/50 text-sm outline-none"
          @keydown="onKeydown"
          @focus="
            activeProvider === 'cardmystic' &&
              suggestions.length > 0 &&
              (showSuggestions = true)
          "
        />
      </div>

      <!-- Autocomplete dropdown (CardMystic only) -->
      <div
        v-if="showSuggestions"
        class="rounded-b-2xl bg-black/40 backdrop-blur-md border border-t-0 border-white/20 overflow-hidden"
      >
        <button
          v-for="(name, i) in suggestions"
          :key="name"
          type="button"
          class="w-full px-5 py-2 text-left text-sm text-white/80 hover:bg-white/10 transition-colors flex items-center gap-3"
          :class="{ 'bg-white/10': i === selectedSuggestionIndex }"
          @click="selectSuggestion(name)"
        >
          <UIcon name="i-heroicons-sparkles" class="text-white/40 text-sm shrink-0" />
          {{ name }}
        </button>
      </div>
    </form>

    <!-- Provider tabs -->
    <div class="flex items-center justify-center gap-1 mt-3">
      <button
        v-for="provider in providers"
        :key="provider.id"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors select-none"
        :class="
          activeProvider === provider.id
            ? 'bg-white/20 text-white backdrop-blur-md'
            : 'text-white/50 hover:text-white/70 hover:bg-white/10'
        "
        @click="selectProvider(provider.id)"
      >
        <UIcon :name="provider.icon" class="text-sm" />
        {{ provider.label }}
      </button>
    </div>
  </div>
</template>
