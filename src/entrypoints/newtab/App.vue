<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useSettings } from '../../composables/useSettings'
import { useClock } from '../../composables/useClock'
import { useArtCache } from '../../composables/useArtCache'
import BackgroundImage from '../../components/BackgroundImage.vue'
import ArtistCredit from '../../components/ArtistCredit.vue'
import ClockDisplay from '../../components/ClockDisplay.vue'
import GreetingMessage from '../../components/GreetingMessage.vue'
import SettingsPanel from '../../components/SettingsPanel.vue'

const {
  userName,
  clockFormat,
  showClock,
  showGreeting,
  showArtistCredit,
  ready,
} = useSettings()

const { formattedTime, formattedDate, period } = useClock(clockFormat)
const { currentArt, isLoading, next, prev } = useArtCache()

// Dev: live vertical offset adjustment
const devOffset = ref(currentArt.value?.verticalOffset ?? 50)
watch(currentArt, (art) => {
  devOffset.value = art?.verticalOffset ?? 50
})

// Dev hotkeys: Left/Right = prev/next art, Up/Down = adjust vertical offset
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') next()
  else if (e.key === 'ArrowLeft') prev()
  else if (e.key === 'ArrowUp') {
    devOffset.value = Math.max(0, devOffset.value - 5)
  } else if (e.key === 'ArrowDown') {
    devOffset.value = Math.min(100, devOffset.value + 5)
  } else if (e.key === 'Enter') {
    console.log(`[offset] ${currentArt.value?.slug}: ${devOffset.value}`)
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// First-run: show name prompt when settings are ready but no name set
const showFirstRun = ref(false)
const firstRunName = ref('')

watch(
  [ready, userName],
  ([r, name]) => {
    showFirstRun.value = r && !name
  },
  { immediate: true },
)

function completeFirstRun() {
  if (firstRunName.value.trim()) {
    userName.value = firstRunName.value.trim()
  }
  showFirstRun.value = false
}
</script>

<template>
  <UApp>
    <div class="relative h-screen w-screen overflow-hidden">
      <!-- Background art with crossfade -->
      <BackgroundImage :art="currentArt" :is-loading="isLoading" :vertical-offset="devOffset" />

      <!-- Center content: greeting + clock -->
      <div
        class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2"
      >
        <GreetingMessage
          :period="period"
          :user-name="userName"
          :visible="showGreeting"
        />
        <ClockDisplay
          :time="formattedTime"
          :date="formattedDate"
          :visible="showClock"
        />
      </div>

      <!-- Artist credit (bottom-left) -->
      <ArtistCredit :art="currentArt" :visible="showArtistCredit" />

      <!-- Settings gear (bottom-right) -->
      <SettingsPanel
        v-model:user-name="userName"
        v-model:clock-format="clockFormat"
        v-model:show-clock="showClock"
        v-model:show-greeting="showGreeting"
        v-model:show-artist-credit="showArtistCredit"
      />

      <!-- First-run name prompt -->
      <UModal v-model:open="showFirstRun" :dismissible="false">
        <template #content>
          <div class="p-6 text-center">
            <i class="ms ms-planeswalker ms-3x mb-4 block text-primary" />
            <h2 class="text-xl font-semibold mb-2">Welcome to Arcane Tab</h2>
            <p class="text-sm text-neutral-500 mb-6">
              Stunning Magic: The Gathering art, every new tab.
            </p>
            <UInput
              v-model="firstRunName"
              placeholder="What's your name?"
              size="lg"
              class="mb-4"
              autofocus
              @keyup.enter="completeFirstRun"
            />
            <UButton
              label="Get Started"
              block
              size="lg"
              @click="completeFirstRun"
            />
          </div>
        </template>
      </UModal>
    </div>
  </UApp>
</template>
