<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ complete: [name: string] }>()

const name = ref('')
const inputRef = ref<HTMLInputElement>()

watch(open, async (v) => {
  if (v) {
    await nextTick()
    setTimeout(() => inputRef.value?.focus(), 220)
  }
})

function submit() {
  emit('complete', name.value.trim())
}
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open"
      class="fixed inset-0 z-[60] bg-neutral-950/92 backdrop-blur-sm flex items-center justify-center p-5"
      role="dialog"
      aria-label="Welcome"
    >
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        appear
      >
        <div
          class="w-[420px] max-w-full rounded-xl bg-neutral-950/92 backdrop-blur-xl border border-white/10 shadow-2xl p-8 text-center text-white"
        >
          <i class="ms ms-planeswalker ms-3x mb-4 block text-white/75" />

          <h2 class="text-xl font-medium text-white mb-1.5">Welcome to Arcane Tab</h2>
          <p class="text-sm text-white/50 mb-5">
            A curated gallery of card art, one piece per new tab.
          </p>

          <input
            ref="inputRef"
            v-model="name"
            type="text"
            placeholder="What's your name?"
            class="w-full rounded-md bg-white/5 border border-white/10 px-3.5 py-3 text-base text-white placeholder-white/30 outline-none focus:border-white/10 focus:bg-white/10 transition-colors mb-3.5"
            @keyup.enter="submit"
          />

          <button
            type="button"
            class="w-full rounded-md bg-white/15 text-white font-medium px-4 py-3 text-base hover:bg-white/30 border border-white/10 transition-colors"
            @click="submit"
          >
            Get started
          </button>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
