<template>
  <div>
    <component
      :is="componentName"
      :class="{ required: get(meta, 'validate.required') }"
      :dark="dark"
      :error-messages="errorMessage"
      :meta="meta"
      :is-new="isNew"
      :is-reviewer="isReviewer"
      @update="updateMeta"
    />
  </div>
  <span
    v-for="it in $pluginRegistry.getAppendComponents(meta.type)"
    :key="it.id">
    <component :is="it.appendComponentName" />
  </span>
</template>

<script lang="ts" setup>
import get from 'lodash/get';
import { getMetaName } from '@tailor-cms/utils';
import type { Metadata } from '@tailor-cms/interfaces/schema';
import { useField } from 'vee-validate';

interface Props {
  meta: Metadata;
  name?: string | null;
  dark?: boolean;
  isNew?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
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

const { errorMessage, handleChange, validate } = useField(
  () => props.meta.key,
  props.meta.validate,
  {
    label: props.meta.key,
    initialValue: props.meta.value,
  },
);

const updateMeta = async (key: string, value: any) => {
  handleChange(value, false);
  const { valid } = await validate();
  if (valid) emit('update', key, value);
};
</script>

<style lang="scss" scoped>
:deep(.title) {
  color: #808080;
  font-size: 0.875rem !important;
  font-weight: normal;
}
</style>
