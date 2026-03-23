<template>
  <VMenu :close-on-content-click="false" location="bottom end" max-width="800">
    <template #activator="{ props: menuProps }">
      <VBtn
        v-bind="menuProps"
        class="text-primary-lighten-3"
        icon="mdi-code-json"
        size="small"
        variant="text"
      />
    </template>
    <VCard color="primary-darken-4" max-height="480" min-width="800">
      <div class="d-flex align-center pa-3 pb-1">
        <span class="text-caption font-weight-bold text-primary-lighten-3">
          Asset Metadata
        </span>
        <VSpacer />
        <VBtn
          color="primary-lighten-3"
          icon="mdi-content-copy"
          size="x-small"
          variant="text"
          @click="copyToClipboard"
        />
      </div>
      <VDivider opacity="0.1" />
      <div class="entries-container pa-3 overflow-y-auto">
        <div
          v-for="(entry, idx) in entries"
          :key="idx"
          class="entry"
        >
          <span class="entry-key">{{ entry.key }}</span>
          <span v-if="entry.isSimple" class="entry-value" :class="entry.color">
            {{ entry.display }}
          </span>
          <pre v-else class="entry-object">{{ entry.display }}</pre>
        </div>
      </div>
    </VCard>
  </VMenu>
</template>

<script lang="ts" setup>
import type { Asset } from '@tailor-cms/interfaces/asset';

const VALUE_COLORS = {
  empty: 'text-primary-lighten-1',
  flag: 'text-teal-lighten-3',
  numeric: 'text-amber-lighten-2',
  text: 'text-primary-lighten-4',
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
  return { key, display, isSimple, color };
}

const props = defineProps<{ asset: Asset }>();

const entries = computed(() => {
  const flat: Record<string, any> = {
    id: props.asset.id,
    type: props.asset.type,
    storageKey: props.asset.storageKey,
    processingStatus: props.asset.processingStatus,
    vectorStoreFileId: props.asset.vectorStoreFileId,
    ...props.asset.meta,
  };
  return Object.entries(flat).map(([k, v]) => formatEntry(k, v));
});

function copyToClipboard() {
  const data = {
    id: props.asset.id,
    type: props.asset.type,
    storageKey: props.asset.storageKey,
    processingStatus: props.asset.processingStatus,
    vectorStoreFileId: props.asset.vectorStoreFileId,
    meta: props.asset.meta,
  };
  navigator.clipboard.writeText(JSON.stringify(data, null, 2));
}
</script>

<style lang="scss" scoped>
.entries-container {
  max-height: 400px;
}

.entry {
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);

  &:last-child {
    border-bottom: none;
  }
}

.entry-key {
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(var(--v-theme-primary-lighten-2), 0.9);
  letter-spacing: 0.02em;
}

.entry-value {
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.75rem;
  margin-top: 1px;
  word-break: break-all;
}

.entry-object {
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.7rem;
  line-height: 1.4;
  color: rgb(var(--v-theme-primary-lighten-3));
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0.125rem 0 0;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}
</style>
