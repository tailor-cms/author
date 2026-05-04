<template>
  <VOverlay
    v-model="expanded"
    :class="{ expanded }"
    content-class="d-flex align-center justify-center h-100 w-100"
    close-on-content-click
  >
    <template #activator="{ props: dialogProps }">
      <VTextField
        v-bind="$attrs"
        :density="density"
        :label="label"
        :max-width="maxWidth"
        :min-width="minWidth"
        :model-value="fileName"
        :variant="variant"
        readonly
      >
        <template #prepend-inner>
          <VProgressCircular v-if="isLoading" indeterminate size="24" />
          <VImg
            v-else-if="showPreview && url"
            :src="url"
            height="24"
            width="24"
            cover
          />
          <VIcon v-else :icon="icon" />
        </template>
        <template #append-inner>
          <VBtn
            v-if="showPreview"
            v-bind="dialogProps"
            aria-label="Preview image"
            class="mr-1"
            size="x-small"
            variant="tonal"
            icon
          >
            <VIcon icon="mdi-magnify" size="large" />
          </VBtn>
          <VBtn
            v-if="!readonly"
            aria-label="Remove file"
            size="x-small"
            variant="tonal"
            icon
            @click.stop="emit('delete')"
          >
            <VIcon icon="mdi-trash-can-outline" size="large" />
          </VBtn>
        </template>
      </VTextField>
    </template>
    <VBtn
      class="position-absolute top-0 right-0 ma-4"
      color="white"
      icon="mdi-close"
      variant="tonal"
      @click="expanded = false"
    />
    <img :src="url" :alt="fileName" />
  </VOverlay>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import type { VTextField } from 'vuetify/components';

interface Props {
  fileName: string;
  url?: string;
  isLoading?: boolean;
  label?: string;
  icon?: string;
  dark?: boolean;
  maxWidth?: string | number;
  minWidth?: string | number;
  showPreview?: boolean;
  variant?: VTextField['variant'];
  density?: VTextField['density'];
  readonly?: boolean;
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  url: '',
  label: '',
  icon: 'mdi-file',
  dark: false,
  maxWidth: '100%',
  minWidth: '350',
  showPreview: false,
  variant: 'outlined',
  density: 'default',
  readonly: false,
});

const emit = defineEmits<{
  download: [];
  delete: [];
}>();

const expanded = ref(false);
</script>

<style lang="scss" scoped>
.v-overlay {
  transition: all 0.3s ease;

  &.expanded {
    backdrop-filter: blur(18px);
  }

  :deep(img) {
    max-width: 100%;
    max-height: 100%;
  }
}
</style>
