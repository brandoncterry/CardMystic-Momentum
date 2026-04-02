import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { TimePeriod } from '../types'

export function useClock(clockFormat: Ref<'12h' | '24h'>) {
  const now = ref(new Date())
  let timer: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    timer = setInterval(() => {
      now.value = new Date()
    }, 1000)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  const formattedTime = computed(() => {
    const d = now.value
    if (clockFormat.value === '24h') {
      return d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    }
    return d.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  })

  const formattedDate = computed(() => {
    return now.value.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  })

  const period = computed<TimePeriod>(() => {
    const hour = now.value.getHours()
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 21) return 'evening'
    return 'night'
  })

  return { formattedTime, formattedDate, period }
}
