<script setup lang="ts">
defineProps<{
  mobileOpen: boolean;
}>();

defineEmits<{
  toggle: [];
  close: [];
}>();
</script>

<template>
  <button
    class="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-(--color-bg) border border-(--color-divider) text-text-2"
    @click="$emit('toggle')"
  >
    <span class="sr-only">Menu</span>
    <svg v-if="!mobileOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </button>

  <div v-if="mobileOpen" class="lg:hidden fixed inset-0 z-30 bg-black/60" @click="$emit('close')" />
</template>
