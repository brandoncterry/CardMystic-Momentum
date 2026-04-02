<script setup lang="ts">
import { ref, onMounted } from 'vue'

defineProps<{
  visible: boolean
}>()

const query = ref('')
const inputRef = ref<HTMLInputElement>()

onMounted(() => {
  inputRef.value?.focus()
})

function handleSearch() {
  const q = query.value.trim()
  if (!q) return

  const isUrl = /^https?:\/\//i.test(q) || (/\.\w+/.test(q) && !/\s/.test(q))

  if (isUrl) {
    window.location.href = q.startsWith('http') ? q : `https://${q}`
  } else {
    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(q)}`
  }
}
</script>

<template>
  <form
    v-if="visible"
    class="w-full max-w-[584px] mt-6"
    @submit.prevent="handleSearch"
  >
    <div
      class="flex items-center gap-3 rounded-full bg-black/30 backdrop-blur-md border border-white/20 px-5 py-3 transition-colors focus-within:bg-black/40 focus-within:border-white/30"
    >
      <UIcon
        name="i-heroicons-magnifying-glass"
        class="text-white/50 text-lg shrink-0"
      />
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        placeholder="Search Google or type a URL"
        class="flex-1 bg-transparent text-white placeholder-white/50 text-sm outline-none"
      />
    </div>
  </form>
</template>
