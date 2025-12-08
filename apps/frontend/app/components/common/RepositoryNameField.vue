<template>
  <div class="name-field-wrapper">
    <VTextField
      v-model="nameInput"
      v-bind="$attrs"
      :error-messages="errors"
      :label="props.label"
      :messages="warning"
      class="required"
      name="name"
      @change="validatedUpdate"
    >
      <template #message="{ message }">
        <div v-if="warning" class="d-flex align-center">
          <VIcon class="text-body-1" color="warning" icon="mdi-alert" start />
          {{ message }}
        </div>
        <template v-else>{{ message }}</template>
      </template>
    </VTextField>
    <!-- Plugin append components -->
    <div v-if="appendPlugins.length && entityData" class="append-slot">
      <component
        :is="plugin.appendComponentName"
        v-for="plugin in appendPlugins"
        :key="plugin.id"
        :meta="meta"
        :data="entityData"
        component-name="meta-text-field"
        @update="update"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { debounce } from 'lodash-es';
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';
import type { Repository } from '@tailor-cms/interfaces/repository';
import { string } from 'yup';
import { useField } from 'vee-validate';

import api from '@/api/repository';

const EXISTING_NAME_MSG =
  'Warning: a Repository with that name already exists.';

interface Props {
  value?: string;
  label?: string;
  repositoryId?: number | null;
  entityData?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  label: 'Name',
  repositoryId: null,
  entityData: undefined,
});
const emit = defineEmits(['change']);

const { $pluginRegistry } = useNuxtApp() as any;

const warning = ref('');
const existingRepositories = ref<Repository[]>([]);

const meta = computed(() => ({
  key: 'name',
  type: MetaInputType.TextField,
  label: 'Name',
  value: props.value || '',
  validate: { required: true, min: 2, max: 250 },
}));

const appendPlugins = computed(() => $pluginRegistry.getAppendComponents());
const parsedRepos = computed(() => existingRepositories.value.map((repo) => {
  const { name, description, data } = repo;
  return $pluginRegistry.filter('data:value', name, {
    data: { name, description, ...data },
    key: 'name',
  });
}));

const {
  value: nameInput,
  errors,
  validate,
} = useField('name', string().required().min(2).max(250), {
  initialValue: props.value,
});

const validatedUpdate = async () => {
  const { valid } = await validate();
  if (valid) update('name', nameInput.value);
};

const update = (key: string, value: string, data?: Record<string, any>) => {
  emit('change', key, value, data);
};

// Update input when value prop changes
watch(
  () => props.value,
  (val) => {
    if (val !== nameInput.value) nameInput.value = val;
  },
);

watch(
  nameInput,
  debounce((val) => {
    const isDuplicate = parsedRepos.value.some((repo) => repo === val);
    warning.value = isDuplicate ? EXISTING_NAME_MSG : '';
  }, 200),
);

onMounted(async () => {
  const params = props.repositoryId ? { repositoryId: props.repositoryId } : {};
  const { items: repositories } = await api.getRepositories(params);
  existingRepositories.value = repositories;
});
</script>

<style lang="scss" scoped>
.name-field-wrapper {
  position: relative;
}

.append-slot {
  position: absolute;
  right: 0;
  bottom: 21px;
}
</style>
