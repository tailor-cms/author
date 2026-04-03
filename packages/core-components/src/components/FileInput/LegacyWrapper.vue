<template>
  <FileInput
    :file-key="fileKey || url || undefined"
    :file-name="fileName"
    :allowed-extensions="resolvedExtensions"
    :allow-url-source="allowUrlSource"
    :use-field-input="useFieldInput"
    :show-preview="showPreview"
    :label="resolvedLabel"
    :placeholder="placeholder"
    :public-url="publicUrl"
    :icon="icon"
    :variant="variant"
    :density="density"
    :dark="dark"
    @input="onInput"
    @upload="onInput"
  />
</template>

<script lang="ts" setup>
// Legacy adapter for published content elements (e.g. ce-image-edit v1.x)
// that use the old prop/event contract.
// Registered globally as TailorAssetInput in global-components.ts.
//
// Legacy CE contract (ce-image-edit):
//   <TailorAssetInput
//     :extensions="['.png', '.jpg', '.jpeg']"   → allowedExtensions (pass-through)
//     :url="element.data.assets?.url"           → fileKey (storage:// prefix stripped)
//     :public-url="element.data.url"            → publicUrl (pass-through)
//     upload-label="Upload image"               → label
//     @input="save"                             → payload transformed to legacy format
//   />
import { computed, onMounted } from 'vue';
import type { VTextField } from 'vuetify/components';

import FileInput from './index.vue';

interface Props {
  // FileInput props; pass-through
  fileKey?: string;
  fileName?: string;
  allowedExtensions?: string[];
  useFieldInput?: boolean;
  showPreview?: boolean;
  label?: string;
  placeholder?: string;
  icon?: string;
  variant?: VTextField['variant'];
  density?: VTextField['density'];
  dark?: boolean;
  allowUrlSource?: boolean;
  publicUrl?: string | null;
  // Legacy props
  // Legacy name for allowedExtensions (same format, just different prop name)
  extensions?: string[];
  // Storage URI (e.g. 'storage://repo/1234__photo.jpg')
  // Mapped to fileKey with storage:// prefix stripped
  url?: string | null;
  // Legacy label prop
  // Mapped to label as fallback
  uploadLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  allowedExtensions: () => [],
  useFieldInput: false,
  showPreview: false,
  variant: 'outlined',
  density: 'default',
  dark: false,
  allowUrlSource: false,
  publicUrl: null,
  // Legacy fileKey (see above);
  url: null,
});

// Re-emit @input with legacy CE payload format
const emit = defineEmits<{
  input: [value: Record<string, any> | null];
}>();

const logDeprecation = (propName: string, alternative: string) => {
  console.warn(
    `[TailorAssetInput] "${propName}" is deprecated. Use "${alternative}" instead.`,
  );
};

onMounted(() => {
  if (props.extensions?.length)
    logDeprecation('extensions', 'allowed-extensions');
  if (props.url) logDeprecation('url', 'file-key');
  if (props.uploadLabel) logDeprecation('upload-label', 'label');
});

// CE passes extensions with dots (['.png']), same format FileInput expects
const resolvedExtensions = computed(() =>
  props.allowedExtensions.length
    ? props.allowedExtensions
    : props.extensions || [],
);

// CE passes uploadLabel, FileInput expects label
const resolvedLabel = computed(() => props.label || props.uploadLabel || '');

// Legacy event bridging
// FileInput emits @input with { key, name, url?, publicUrl? } | null.
// CEs expect @input with { url: 'storage://...', publicUrl } | { url: null, publicUrl: null }.
const onInput = (value: Record<string, any> | null) => {
  if (!value) {
    emit('input', { url: null, publicUrl: null });
    return;
  }
  if (value.key) {
    emit('input', {
      url: `storage://${value.key}`,
      publicUrl: value.publicUrl || null,
    });
    return;
  }
  emit('input', value);
};
</script>
