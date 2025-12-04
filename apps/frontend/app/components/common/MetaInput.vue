<template>
  <div class="meta-input-wrapper">
    <component
      :is="componentName"
      :class="{ required: get(meta, 'validate.required') }"
      :dark="dark"
      :error-messages="errorMessage"
      :meta="metaWithValue"
      :is-new="isNew"
      :is-reviewer="isReviewer"
      @update="updateMeta"
    />
    <!-- Plugin append components - hidden for new items -->
    <div v-if="appendPlugins.length && !isNew" class="append-slot">
      <component
        :is="plugin.appendComponentName"
        v-for="plugin in appendPlugins"
        :key="plugin.id"
        :meta="meta"
        :data="entityData"
        :dark="dark"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { get, size } from 'lodash-es';
import { getMetaName } from '@tailor-cms/utils';
import type { Metadata } from '@tailor-cms/interfaces/schema';
import { useField } from 'vee-validate';

interface Props {
  meta: Metadata;
  entityData?: Record<string, any>;
  name?: string | null;
  dark?: boolean;
  isNew?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  entityData: () => ({}),
  name: null,
  dark: false,
  isNew: false,
});

const emit = defineEmits(['update']);

const { $pluginRegistry } = useNuxtApp() as any;
const store = useCurrentRepository();

const isReviewer = computed(() => store.repository?.hasAdminAccess);
const type = computed(() => props.meta.type.toUpperCase());
const componentName = computed(() => getMetaName(type.value));

// Get plugins with append components
const appendPlugins = computed(() => $pluginRegistry.getAppendComponents());

// Get value via plugin hooks (e.g., i18n localization)
const processedValue = computed(() => {
  if (!size(props.entityData)) return props.meta.value;
  const key = props.meta.key;
  const rawValue = props.entityData[key];
  return $pluginRegistry.filter('data:value', rawValue, {
    data: props.entityData,
    key,
  });
});

// Meta object with processed value
const metaWithValue = computed(() => ({
  ...props.meta,
  value: processedValue.value ?? props.meta.value,
}));

const { errorMessage, handleChange, validate } = useField(
  () => props.meta.key,
  props.meta.validate,
  {
    label: props.meta.key,
    initialValue: processedValue.value,
  },
);

const updateMeta = async (key: string, value: any) => {
  handleChange(value, false);
  const { valid } = await validate();
  if (!valid) return;

  // Transform data through plugin hooks (e.g., i18n localization)
  if (props.entityData) {
    const updatedData = $pluginRegistry.transform(
      'data:update',
      props.entityData,
      { key, value },
    );
    emit('update', key, value, updatedData);
  } else {
    emit('update', key, value);
  }
};
</script>

<style lang="scss" scoped>
.meta-input-wrapper {
  position: relative;
}

.append-slot {
  position: absolute;
  right: 0;
  bottom: 21px;
}

:deep(.title) {
  color: #808080;
  font-size: 0.875rem !important;
  font-weight: normal;
}
</style>
