<template>
  <VDialog :model-value="show" :width="width" persistent>
    <VCard>
      <VCardText>
        {{ label }}
        <VProgressLinear :model-value="status" class="mt-2" color="secondary" />
      </VCardText>
    </VCard>
  </VDialog>
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
