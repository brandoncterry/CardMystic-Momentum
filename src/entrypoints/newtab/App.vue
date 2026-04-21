<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSettings } from '../../composables/useSettings'
import { useClock } from '../../composables/useClock'
import { useArtCache } from '../../composables/useArtCache'
import { useFavorites } from '../../composables/useFavorites'
import BackgroundImage from '../../components/BackgroundImage.vue'
import ArtistCredit from '../../components/ArtistCredit.vue'
import ClockDisplay from '../../components/ClockDisplay.vue'
import GreetingMessage from '../../components/GreetingMessage.vue'
import SettingsPanel from '../../components/SettingsPanel.vue'
import SearchBar from '../../components/SearchBar.vue'
import TopSites from '../../components/TopSites.vue'
import DashboardControls from '../../components/DashboardControls.vue'
import FirstRunModal from '../../components/FirstRunModal.vue'

const {
  userName,
  clockFormat,
  showClock,
  showGreeting,
  showSearchBar,
  showTopSites,
  textReadability,
  fontFamily,
  clockSize,
  dateSize,
  greetingSize,
  ready,
} = useSettings()

const { formattedTime, formattedDate, period } = useClock(clockFormat)
const { currentArt, isLoading } = useArtCache()
const { favorites, isFavorited, toggleFavorite } = useFavorites()

const settingsOpen = ref(false)
const showFirstRun = ref(false)

const isCurrentFavorited = computed(() =>
  currentArt.value ? isFavorited(currentArt.value.uuid) : false,
)

function handleToggleFavorite() {
  if (currentArt.value) toggleFavorite(currentArt.value)
}

watch(
  [ready, userName],
  ([r, name]) => {
    showFirstRun.value = r && !name
  },
  { immediate: true },
)

function completeFirstRun(name: string) {
  if (name) userName.value = name
  showFirstRun.value = false
}
</script>

<template>
  <UApp>
    <div class="relative h-screen w-screen overflow-hidden">
      <BackgroundImage :art="currentArt" :is-loading="isLoading" :vertical-offset="currentArt?.verticalOffset ?? 50" />

      <div
        class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4"
      >
        <ClockDisplay
          :time="formattedTime"
          :date="formattedDate"
          :visible="showClock"
          :readability="textReadability"
          :font-family="fontFamily"
          :clock-size="clockSize"
          :date-size="dateSize"
        />
        <GreetingMessage
          :period="period"
          :user-name="userName"
          :visible="showGreeting"
          :readability="textReadability"
          :font-family="fontFamily"
          :greeting-size="greetingSize"
        />
        <SearchBar :visible="showSearchBar" />
        <TopSites :visible="showTopSites" />
      </div>

      <ArtistCredit :art="currentArt" />
    </div>

    <DashboardControls
      v-model:settings-open="settingsOpen"
      :is-favorited="isCurrentFavorited"
      @toggle-favorite="handleToggleFavorite"
    />

    <SettingsPanel
      v-model:open="settingsOpen"
      v-model:user-name="userName"
      v-model:clock-format="clockFormat"
      v-model:show-clock="showClock"
      v-model:show-greeting="showGreeting"
      v-model:show-search-bar="showSearchBar"
      v-model:show-top-sites="showTopSites"
      v-model:text-readability="textReadability"
      v-model:font-family="fontFamily"
      v-model:clock-size="clockSize"
      v-model:date-size="dateSize"
      v-model:greeting-size="greetingSize"
      :favorites="favorites"
    />

    <FirstRunModal
      v-model:open="showFirstRun"
      @complete="completeFirstRun"
    />
  </UApp>
</template>
