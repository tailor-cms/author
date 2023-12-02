<template>
  <VContainer>
    <VAlert color="teal">
      Hello {{ store?.user?.email }}!
    </VAlert>
  </VContainer>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

definePageMeta({ middleware: ['auth'] });

const store = useAuthStore();
</script>
