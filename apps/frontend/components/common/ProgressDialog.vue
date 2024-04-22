<template>
  <div class="text-center">
    <VDialog :model-value="show" :width="width" persistent>
      <VCard color="primary-darken-3">
        <VCardText>
          {{ label }}
          <VProgressLinear
            :model-value="status"
            bg-color="primary-lighten-5"
            class="mt-2 mb-3"
            color="teal-accent-4"
          />
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  show: { type: Boolean, default: false },
  status: { type: Number, default: 0 },
  width: { type: Number, default: 300 },
  label: { type: String, default: 'Please wait...' },
});
</script>
