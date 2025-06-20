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
interface Props {
  show?: boolean;
  status?: number;
  width?: number;
  label?: string;
}

withDefaults(defineProps<Props>(), {
  show: false,
  status: 0,
  width: 300,
  label: 'Please wait...',
});
</script>
