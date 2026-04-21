import { ref, watch } from 'vue'
import type { UserSettings } from '../types'
import { settingsStorage, DEFAULT_SETTINGS } from '../utils/storage'

const FONT_FAMILIES: UserSettings['fontFamily'][] = [
  'system',
  'serif',
  'mono',
  'rounded',
]
const SIZES: UserSettings['clockSize'][] = ['small', 'medium', 'large']

function pick<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

export function useSettings() {
  const userName = ref(DEFAULT_SETTINGS.userName)
  const clockFormat = ref<UserSettings['clockFormat']>(
    DEFAULT_SETTINGS.clockFormat,
  )
  const showClock = ref(DEFAULT_SETTINGS.showClock)
  const showGreeting = ref(DEFAULT_SETTINGS.showGreeting)
  const showSearchBar = ref(DEFAULT_SETTINGS.showSearchBar)
  const showTopSites = ref(DEFAULT_SETTINGS.showTopSites)
  const textReadability = ref<UserSettings['textReadability']>(
    DEFAULT_SETTINGS.textReadability,
  )
  const fontFamily = ref<UserSettings['fontFamily']>(DEFAULT_SETTINGS.fontFamily)
  const clockSize = ref<UserSettings['clockSize']>(DEFAULT_SETTINGS.clockSize)
  const dateSize = ref<UserSettings['dateSize']>(DEFAULT_SETTINGS.dateSize)
  const greetingSize = ref<UserSettings['greetingSize']>(
    DEFAULT_SETTINGS.greetingSize,
  )
  const ready = ref(false)

  async function load() {
    const stored = await settingsStorage.getValue()
    if (stored) {
      userName.value = stored.userName
      clockFormat.value = stored.clockFormat
      showClock.value = stored.showClock
      showGreeting.value = stored.showGreeting
      showSearchBar.value = stored.showSearchBar ?? DEFAULT_SETTINGS.showSearchBar
      showTopSites.value = stored.showTopSites ?? DEFAULT_SETTINGS.showTopSites
      textReadability.value = pick(
        stored.textReadability,
        ['subtle', 'strong'] as const,
        DEFAULT_SETTINGS.textReadability,
      )
      fontFamily.value = pick(
        stored.fontFamily,
        FONT_FAMILIES,
        DEFAULT_SETTINGS.fontFamily,
      )
      clockSize.value = pick(stored.clockSize, SIZES, DEFAULT_SETTINGS.clockSize)
      dateSize.value = pick(stored.dateSize, SIZES, DEFAULT_SETTINGS.dateSize)
      greetingSize.value = pick(
        stored.greetingSize,
        SIZES,
        DEFAULT_SETTINGS.greetingSize,
      )
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
        showSearchBar: showSearchBar.value,
        showTopSites: showTopSites.value,
        textReadability: textReadability.value,
        fontFamily: fontFamily.value,
        clockSize: clockSize.value,
        dateSize: dateSize.value,
        greetingSize: greetingSize.value,
      })
    }, 300)
  }

  watch(
    [
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
    ],
    saveSettings,
  )

  load()

  return {
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
  }
}
