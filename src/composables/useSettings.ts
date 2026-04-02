import { ref, watch } from 'vue'
import type { UserSettings } from '../types'
import { settingsStorage, DEFAULT_SETTINGS } from '../utils/storage'

export function useSettings() {
  const userName = ref(DEFAULT_SETTINGS.userName)
  const clockFormat = ref<UserSettings['clockFormat']>(
    DEFAULT_SETTINGS.clockFormat,
  )
  const showClock = ref(DEFAULT_SETTINGS.showClock)
  const showGreeting = ref(DEFAULT_SETTINGS.showGreeting)
  const showArtistCredit = ref(DEFAULT_SETTINGS.showArtistCredit)
  const showSearchBar = ref(DEFAULT_SETTINGS.showSearchBar)
  const showTopSites = ref(DEFAULT_SETTINGS.showTopSites)
  const ready = ref(false)

  async function load() {
    const stored = await settingsStorage.getValue()
    if (stored) {
      userName.value = stored.userName
      clockFormat.value = stored.clockFormat
      showClock.value = stored.showClock
      showGreeting.value = stored.showGreeting
      showArtistCredit.value = stored.showArtistCredit
      showSearchBar.value = stored.showSearchBar ?? DEFAULT_SETTINGS.showSearchBar
      showTopSites.value = stored.showTopSites ?? DEFAULT_SETTINGS.showTopSites
    }
    ready.value = true
  }

  let saveTimeout: ReturnType<typeof setTimeout> | null = null

  function saveSettings() {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(async () => {
      await settingsStorage.setValue({
        userName: userName.value,
        clockFormat: clockFormat.value,
        showClock: showClock.value,
        showGreeting: showGreeting.value,
        showArtistCredit: showArtistCredit.value,
        showSearchBar: showSearchBar.value,
        showTopSites: showTopSites.value,
      })
    }, 300)
  }

  watch(
    [userName, clockFormat, showClock, showGreeting, showArtistCredit, showSearchBar, showTopSites],
    saveSettings,
  )

  load()

  return {
    userName,
    clockFormat,
    showClock,
    showGreeting,
    showArtistCredit,
    showSearchBar,
    showTopSites,
    ready,
  }
}
