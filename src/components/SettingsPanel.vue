<script setup lang="ts">
import { ref } from 'vue'
import type { UserSettings, ResolvedCard } from '../types'

const open = defineModel<boolean>('open', { required: true })

const userName = defineModel<string>('userName', { required: true })
const clockFormat = defineModel<UserSettings['clockFormat']>('clockFormat', { required: true })
const showClock = defineModel<boolean>('showClock', { required: true })
const showGreeting = defineModel<boolean>('showGreeting', { required: true })
const showSearchBar = defineModel<boolean>('showSearchBar', { required: true })
const showTopSites = defineModel<boolean>('showTopSites', { required: true })
const textReadability = defineModel<UserSettings['textReadability']>('textReadability', { required: true })
const fontFamily = defineModel<UserSettings['fontFamily']>('fontFamily', { required: true })
const clockSize = defineModel<UserSettings['clockSize']>('clockSize', { required: true })
const dateSize = defineModel<UserSettings['dateSize']>('dateSize', { required: true })
const greetingSize = defineModel<UserSettings['greetingSize']>('greetingSize', { required: true })

defineProps<{
  favorites?: ResolvedCard[]
}>()

const readabilityOptions = [
  { value: 'subtle', label: 'Subtle' },
  { value: 'strong', label: 'Strong' },
] as const

const fontOptions = [
  { value: 'system', label: 'System' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Mono' },
  { value: 'rounded', label: 'Rounded' },
] as const

const sizeOptions = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
] as const

type SectionId = 'general' | 'appearance' | 'favorites' | 'about'
const activeSection = ref<SectionId>('general')

const sections: { id: SectionId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'about', label: 'About' },
]
</script>

<template>
  <!-- Floating settings popup (right side) -->
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0 translate-x-4"
    enter-to-class="opacity-100 translate-x-0"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100 translate-x-0"
    leave-to-class="opacity-0 translate-x-4"
  >
    <div
      v-if="open"
      class="fixed right-4 top-4 bottom-20 z-30 w-[680px] max-w-[calc(100vw-2rem)] rounded-xl bg-neutral-950/92 backdrop-blur-xl border border-white/10 shadow-2xl text-white overflow-hidden flex"
      role="dialog"
      aria-label="Settings"
    >
      <!-- Sidebar nav -->
      <aside class="w-44 shrink-0 border-r border-white/5 flex flex-col py-6 px-3">
        <div class="flex items-center gap-2 px-2.5 mb-5">
          <i class="ms ms-planeswalker text-white text-base" />
          <span class="text-sm font-semibold tracking-tight">Arcane Tab</span>
        </div>

        <nav class="flex flex-col gap-0.5">
          <button
            v-for="section in sections"
            :key="section.id"
            type="button"
            class="text-left px-3 py-2 rounded-md text-[14px] transition-colors"
            :class="
              activeSection === section.id
                ? 'text-white bg-white/10'
                : 'text-white/55 hover:text-white hover:bg-white/5'
            "
            @click="activeSection = section.id"
          >
            {{ section.label }}
          </button>
        </nav>

        <div class="mt-auto px-2.5 text-[11px] text-white/30 leading-relaxed">
          v1.0 · Fan-made<br />unaffiliated project
        </div>
      </aside>

      <!-- Content area -->
      <section class="flex-1 overflow-y-auto px-7 py-6 relative">
        <button
          type="button"
          aria-label="Close settings"
          class="absolute top-3.5 right-3.5 size-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          @click="open = false"
        >
          <UIcon name="i-heroicons-x-mark" class="size-5" />
        </button>

        <!-- GENERAL -->
        <div v-if="activeSection === 'general'">
          <header class="mb-6">
            <h2 class="text-[22px] font-medium text-white tracking-tight">General</h2>
            <p class="text-sm text-white/50 mt-1">Customize your dashboard</p>
          </header>

          <h3 class="text-[11px] uppercase tracking-[0.12em] text-white/40 mb-2 mt-6 font-medium">Identity</h3>
          <div class="py-4 border-b border-white/5">
            <label class="flex flex-col gap-2">
              <span class="text-sm text-white/75">Your name</span>
              <input
                v-model="userName"
                type="text"
                placeholder="Enter your name"
                class="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/10 focus:bg-white/10 transition-colors"
              />
            </label>
          </div>

          <h3 class="text-[11px] uppercase tracking-[0.12em] text-white/40 mt-6 mb-2 font-medium">Widgets</h3>

          <!-- Clock -->
          <div class="py-4 border-b border-white/5">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="text-[15px] text-white">Clock</div>
                <p class="text-xs text-white/50 mt-0.5">Show the current time at the center of your dashboard</p>
              </div>
              <USwitch v-model="showClock" color="neutral" />
            </div>
            <div v-if="showClock" class="mt-3 flex items-center gap-1 rounded-md bg-white/5 p-0.5 w-fit">
              <button
                type="button"
                class="px-3 py-1 rounded text-xs transition-colors"
                :class="clockFormat === '12h' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/75'"
                @click="clockFormat = '12h'"
              >12-hour</button>
              <button
                type="button"
                class="px-3 py-1 rounded text-xs transition-colors"
                :class="clockFormat === '24h' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/75'"
                @click="clockFormat = '24h'"
              >24-hour</button>
            </div>
          </div>

          <!-- Greeting -->
          <div class="py-4 border-b border-white/5 flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="text-[15px] text-white">Greeting</div>
              <p class="text-xs text-white/50 mt-0.5">Personalized greeting below the clock</p>
            </div>
            <USwitch v-model="showGreeting" color="neutral" />
          </div>

          <!-- Search -->
          <div class="py-4 border-b border-white/5 flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="text-[15px] text-white">Search</div>
              <p class="text-xs text-white/50 mt-0.5">Start searching the web from your dashboard</p>
            </div>
            <USwitch v-model="showSearchBar" color="neutral" />
          </div>

          <!-- Top Sites -->
          <div class="py-4 flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="text-[15px] text-white">Top Sites</div>
              <p class="text-xs text-white/50 mt-0.5">Show your most visited websites as shortcuts</p>
            </div>
            <USwitch v-model="showTopSites" color="neutral" />
          </div>
        </div>

        <!-- APPEARANCE -->
        <div v-else-if="activeSection === 'appearance'">
          <header class="mb-6">
            <h2 class="text-[22px] font-medium text-white tracking-tight">Appearance</h2>
            <p class="text-sm text-white/50 mt-1">Typography and readability</p>
          </header>

          <h3 class="text-[11px] uppercase tracking-[0.12em] text-white/40 mb-2 mt-6 font-medium">Readability</h3>
          <div class="py-4 border-b border-white/5">
            <div class="text-[15px] text-white">Text style</div>
            <p class="text-xs text-white/50 mt-0.5">Improve clock and greeting legibility on busy backgrounds</p>
            <div class="mt-3 flex items-center gap-1 rounded-md bg-white/5 p-0.5 w-fit">
              <button
                v-for="opt in readabilityOptions"
                :key="opt.value"
                type="button"
                class="px-3 py-1 rounded text-xs transition-colors"
                :class="textReadability === opt.value ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/75'"
                @click="textReadability = opt.value"
              >{{ opt.label }}</button>
            </div>
          </div>

          <h3 class="text-[11px] uppercase tracking-[0.12em] text-white/40 mt-6 mb-2 font-medium">Typography</h3>

          <div class="py-4 border-b border-white/5">
            <div class="text-[15px] text-white">Font</div>
            <p class="text-xs text-white/50 mt-0.5">Font family for clock, date, and greeting</p>
            <div class="mt-3 flex items-center gap-1 rounded-md bg-white/5 p-0.5 w-fit">
              <button
                v-for="opt in fontOptions"
                :key="opt.value"
                type="button"
                class="px-3 py-1 rounded text-xs transition-colors"
                :class="fontFamily === opt.value ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/75'"
                @click="fontFamily = opt.value"
              >{{ opt.label }}</button>
            </div>
          </div>

          <div class="py-4 border-b border-white/5">
            <div class="text-[15px] text-white">Clock size</div>
            <p class="text-xs text-white/50 mt-0.5">Size of the time display</p>
            <div class="mt-3 flex items-center gap-1 rounded-md bg-white/5 p-0.5 w-fit">
              <button
                v-for="opt in sizeOptions"
                :key="opt.value"
                type="button"
                class="px-3 py-1 rounded text-xs transition-colors"
                :class="clockSize === opt.value ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/75'"
                @click="clockSize = opt.value"
              >{{ opt.label }}</button>
            </div>
          </div>

          <div class="py-4 border-b border-white/5">
            <div class="text-[15px] text-white">Date size</div>
            <p class="text-xs text-white/50 mt-0.5">Size of the date line below the clock</p>
            <div class="mt-3 flex items-center gap-1 rounded-md bg-white/5 p-0.5 w-fit">
              <button
                v-for="opt in sizeOptions"
                :key="opt.value"
                type="button"
                class="px-3 py-1 rounded text-xs transition-colors"
                :class="dateSize === opt.value ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/75'"
                @click="dateSize = opt.value"
              >{{ opt.label }}</button>
            </div>
          </div>

          <div class="py-4">
            <div class="text-[15px] text-white">Greeting size</div>
            <p class="text-xs text-white/50 mt-0.5">Size of the personalized greeting</p>
            <div class="mt-3 flex items-center gap-1 rounded-md bg-white/5 p-0.5 w-fit">
              <button
                v-for="opt in sizeOptions"
                :key="opt.value"
                type="button"
                class="px-3 py-1 rounded text-xs transition-colors"
                :class="greetingSize === opt.value ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/75'"
                @click="greetingSize = opt.value"
              >{{ opt.label }}</button>
            </div>
          </div>
        </div>

        <!-- FAVORITES -->
        <div v-else-if="activeSection === 'favorites'">
          <header class="mb-6">
            <h2 class="text-[22px] font-medium text-white tracking-tight">Favorites</h2>
            <p class="text-sm text-white/50 mt-1">
              {{ (favorites?.length ?? 0) }} piece{{ (favorites?.length ?? 0) === 1 ? '' : 's' }} saved
            </p>
          </header>

          <div
            v-if="!favorites || favorites.length === 0"
            class="py-14 px-5 text-center text-white/50 rounded-xl border border-dashed border-white/10 mt-4"
          >
            <UIcon name="i-heroicons-heart" class="size-5 text-white/30 mb-3" />
            <div class="text-sm text-white/75">No favorites yet</div>
            <div class="text-xs mt-1.5">Tap the heart on any piece you love to save it here.</div>
          </div>

          <div v-else class="grid grid-cols-2 gap-3 mt-2">
            <a
              v-for="card in favorites"
              :key="card.uuid"
              :href="card.scryfallUri"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-xl overflow-hidden border border-white/5 aspect-[16/10] relative block hover:border-white/10 transition-colors"
              :style="{ backgroundColor: card.dominantColor }"
            >
              <img
                :src="card.imageUrl"
                :alt="card.cardName"
                class="absolute inset-0 w-full h-full object-cover"
                :style="{ objectPosition: `center ${card.verticalOffset ?? 50}%` }"
              />
              <div class="absolute inset-x-0 bottom-0 px-2.5 pt-5 pb-2 bg-gradient-to-t from-neutral-950/92 to-transparent text-white text-[11px]">
                <div class="font-medium truncate">{{ card.cardName }}</div>
                <div class="text-white/55 text-[10px] truncate">{{ card.artistName }}</div>
              </div>
            </a>
          </div>
        </div>

        <!-- ABOUT -->
        <div v-else-if="activeSection === 'about'">
          <header class="mb-6">
            <h2 class="text-[22px] font-medium text-white tracking-tight">About</h2>
            <p class="text-sm text-white/50 mt-1">Arcane Tab — Magic: The Gathering art on every new tab</p>
          </header>

          <div class="space-y-4 text-sm text-white/75 leading-relaxed">
            <p>
              Arcane Tab replaces your new tab page with a curated rotation of stunning Magic:
              The Gathering card art — one piece per day.
            </p>

            <div class="rounded-md border border-white/10 bg-white/5 p-4">
              <h3 class="text-sm font-medium text-white mb-2">Fan Content Policy</h3>
              <p class="text-xs text-white/55 leading-relaxed">
                Arcane Tab is unofficial Fan Content permitted under the Fan Content Policy. Not
                approved/endorsed by Wizards. Portions of the materials used are property of
                Wizards of the Coast. &copy; Wizards of the Coast LLC.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </Transition>
</template>
