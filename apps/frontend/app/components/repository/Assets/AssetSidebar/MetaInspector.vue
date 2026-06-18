<template>
  <VMenu :close-on-content-click="false" location="bottom end" max-width="800">
    <template #activator="{ props: menuProps }">
      <VBtn
        v-tooltip:bottom="'View raw metadata'"
        v-bind="menuProps"
        aria-label="View raw metadata"
        density="comfortable"
        size="small"
        icon="mdi-code-json"
        variant="text"
      />
    </template>
    <VCard max-height="480" width="800">
      <div class="d-flex align-center px-3 py-2">
        <span class="text-body-large font-weight-medium">Asset Metadata</span>
        <VSpacer />
        <VBtn
          icon="mdi-content-copy"
          size="small"
          variant="text"
          @click="copyToClipboard"
        />
      </div>
      <VDivider opacity="0.1" />
      <div class="entries-container pa-4 overflow-y-auto">
        <div
          v-for="({ display, color, isSimple, key }, idx) in entries"
          :key="idx"
          class="entry"
        >
          <VDivider v-if="idx > 0" class="my-2" opacity="0.1" />
          <span class="entry-key text-label-large font-weight-bold">
            {{ key }}
          </span>
          <span
            v-if="isSimple"
            :class="color"
            class="entry-value text-label-medium"
          >
            {{ display }}
          </span>
          <VSheet v-else color="surface-container-low mt-1" rounded>
            <pre class="entry-object text-label-medium ma-0">{{ display }}</pre>
          </VSheet>
        </div>
      </div>
    </VCard>
  </VMenu>
</template>

<script lang="ts" setup>
import type { Asset } from '@tailor-cms/interfaces/asset';

const VALUE_COLORS = {
  empty: 'text-medium-emphasis',
  flag: 'text-secondary',
  numeric: 'text-warning',
  text: '',
} as const;

function formatEntry(key: string, value: any) {
  const isNull = value === null || value === undefined;
  const isSimple = isNull || typeof value !== 'object';
  const display = isSimple
    ? (isNull ? 'null' : String(value))
    : JSON.stringify(value, null, 2);
  let color: string = VALUE_COLORS.text;
  if (isNull) color = VALUE_COLORS.empty;
  else if (typeof value === 'boolean') color = VALUE_COLORS.flag;
  else if (typeof value === 'number') color = VALUE_COLORS.numeric;
  return { key, display, color, isSimple };
}

function getTopLevelFields(asset: Asset) {
  return {
    id: asset.id,
    type: asset.type,
    storageKey: asset.storageKey,
    processingStatus: asset.processingStatus,
    vectorStoreFileId: asset.vectorStoreFileId,
  };
}

const props = defineProps<{ asset: Asset }>();

const entries = computed(() => {
  const flat = { ...getTopLevelFields(props.asset), ...props.asset.meta };
  return Object.entries(flat).map(([k, v]) => formatEntry(k, v));
});

function copyToClipboard() {
  const data = { ...getTopLevelFields(props.asset), meta: props.asset.meta };
  navigator.clipboard.writeText(JSON.stringify(data, null, 2));
}
</script>

<style lang="scss" scoped>
$font-mono: 'Fira Code', 'Courier New', monospace;

.entries-container {
  max-height: 25rem;
}

.entry {
  display: flex;
  flex-direction: column;
}

.entry-key {
  font-family: $font-mono;
  letter-spacing: 0.02em;
}

.entry-value {
  font-family: $font-mono;
  word-break: break-all;
}

.entry-object {
  font-family: $font-mono;
  white-space: pre-wrap;
  word-break: break-all;
  padding: 0.25rem 0.5rem;
}
</style>
