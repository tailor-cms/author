<template>
  <div class="mb-5 text-left">
    <div class="v-label ma-1 text-caption">{{ label }}</div>
    <VCard
      :color="dark ? 'primary-lighten-4' : 'primary'"
      class="d-flex align-center"
      max-width="460"
      rounded="lg"
      variant="tonal"
      border
      @click="showPreview && (expanded = true)"
    >
      <VAvatar class="mr-3" color="primary" rounded="lg" size="75">
        <VProgressCircular v-if="isLoading" indeterminate />
        <VImg v-else-if="showPreview && url" :src="url" cover />
        <VIcon v-else :icon="icon" size="x-large" />
      </VAvatar>
      <div
        :class="dark ? 'text-primary-lighten-3' : 'text-primary-darken-2'"
        class="file-name text-body-1 text-truncate"
      >
        {{ fileName }}
      </div>
      <VSpacer />
      <div class="d-flex ma-3">
        <VBtn
          :color="dark ? 'primary-lighten-3' : 'primary-lighten-1'"
          class="ml-3"
          icon="mdi-download"
          size="small"
          variant="tonal"
          @click.stop="emit('download')"
        />
        <VBtn
          :color="dark ? 'secondary-lighten-3' : 'secondary-lighten-1'"
          class="ml-2"
          icon="mdi-trash-can-outline"
          size="small"
          variant="tonal"
          @click.stop="emit('delete')"
        />
      </div>
    </VCard>
    <VOverlay
      v-if="showPreview"
      v-model="expanded"
      :class="{ expanded }"
      content-class="d-flex align-center justify-center h-100 w-100"
      close-on-content-click
    >
      <VBtn
        class="position-absolute top-0 right-0 ma-4"
        color="white"
        icon="mdi-close"
        variant="tonal"
        @click="expanded = false"
      />
      <img v-if="url" :src="url" :alt="fileName" />
    </VOverlay>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

interface Props {
  fileName: string;
  url?: string;
  isLoading?: boolean;
  label?: string;
  icon?: string;
  dark?: boolean;
  showPreview?: boolean;
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  url: '',
  label: '',
  icon: 'mdi-file',
  dark: false,
  showPreview: false,
});

const emit = defineEmits(['download', 'delete']);

const expanded = ref(false);
</script>

<style lang="scss" scoped>
.file-name {
  max-width: 15rem;
}

.v-overlay {
  transition: all 0.3s ease;

  &.expanded {
    backdrop-filter: blur(18px);
  }

  :deep(img) {
    max-width: 100%;
  }
}

.v-label {
  opacity: 0.65;
}
</style>
