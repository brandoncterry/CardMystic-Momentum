<script setup lang="ts">
import { ref } from 'vue'
import type { UserSettings } from '../types'

const userName = defineModel<string>('userName', { required: true })
const clockFormat = defineModel<UserSettings['clockFormat']>('clockFormat', {
  required: true,
})
const showClock = defineModel<boolean>('showClock', { required: true })
const showGreeting = defineModel<boolean>('showGreeting', { required: true })
const showArtistCredit = defineModel<boolean>('showArtistCredit', {
  required: true,
})

const isOpen = ref(false)

const clockFormatOptions = [
  { label: '12-hour', value: '12h' },
  { label: '24-hour', value: '24h' },
]
</script>

<template>
  <div class="fixed bottom-4 right-4 z-30">
    <UButton
      icon="i-heroicons-cog-6-tooth"
      variant="ghost"
      color="white"
      size="lg"
      class="text-white/70 hover:text-white transition-colors"
      aria-label="Settings"
      @click="isOpen = true"
    />
  </div>

  <USlideover v-model:open="isOpen" title="Settings" description="Customize your new tab experience">
    <template #body>
      <div class="flex flex-col gap-6 p-4">
        <!-- Name -->
        <UFormField label="Your name">
          <UInput
            v-model="userName"
            placeholder="Enter your name"
            class="w-full"
          />
        </UFormField>

        <!-- Clock format -->
        <UFormField label="Clock format">
          <USelect
            v-model="clockFormat"
            :items="clockFormatOptions"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <!-- Visibility toggles -->
        <div class="border-t border-white/10 pt-4">
          <h3 class="text-sm font-medium mb-3">Visibility</h3>
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-sm">Show clock</span>
              <USwitch v-model="showClock" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm">Show greeting</span>
              <USwitch v-model="showGreeting" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm">Show artist credit</span>
              <USwitch v-model="showArtistCredit" />
            </div>
          </div>
        </div>

        <!-- Fan Content Policy -->
        <div class="border-t border-white/10 pt-4">
          <h3 class="text-sm font-medium mb-2">About</h3>
          <p class="text-xs text-neutral-400 leading-relaxed">
            Arcane Tab is unofficial Fan Content permitted under the Fan Content
            Policy. Not approved/endorsed by Wizards. Portions of the materials
            used are property of Wizards of the Coast. &copy; Wizards of the
            Coast LLC.
          </p>
        </div>
      </div>
    </template>
  </USlideover>
</template>
