<template>
  <TailorDialog
    v-model="isDialogVisible"
    data-testid="user-export-dialog"
    header-icon="mdi-tray-arrow-down"
    title="Export users"
    @submit="submit"
  >
    <template #body>
      <div class="mb-5 text-body-2 text-medium-emphasis">
        Downloads {{ summary }} as a CSV file.
      </div>
      <VCheckbox
        v-model="areUserGroupsIncluded"
        density="comfortable"
        label="Include user groups"
        hide-details
      />
      <VAlert
        class="text-body-2 mt-2"
        icon="mdi-alert-circle-outline"
        type="warning"
        variant="tonal"
        prominent
      >
        The file contains personal data, store and share it accordingly.
      </VAlert>
    </template>
    <template #actions>
      <VBtn text="Cancel" variant="text" @click="close" />
      <VBtn
        :disabled="!total"
        color="primary"
        prepend-icon="mdi-tray-arrow-down"
        text="Export"
        type="submit"
        variant="flat"
      />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { TailorDialog } from '@tailor-cms/core-components';

export interface Props {
  visible?: boolean;
  filter?: string;
  includeArchived?: boolean;
  total?: number;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  filter: '',
  includeArchived: false,
  total: 0,
});

const emit = defineEmits(['update:visible']);

const notify = useNotification();

const isDialogVisible = computed({
  get: () => props.visible,
  set(value) {
    if (!value) close();
  },
});

const areUserGroupsIncluded = ref(false);

const summary = computed(() => {
  const scope = props.includeArchived ? '' : 'active ';
  const noun = props.total === 1 ? 'user' : 'users';
  const match = props.filter ? ` matching "${props.filter}"` : '';
  return `${props.total} ${scope}${noun}${match}`;
});

const exportUrl = computed(() => {
  const query = new URLSearchParams();
  if (props.filter) query.set('filter', props.filter);
  if (props.includeArchived) query.set('archived', 'true');
  if (areUserGroupsIncluded.value) query.set('includeUserGroups', 'true');
  return `/api/users/export?${query}`;
});

const submit = () => {
  // The response is a file attachment
  const anchor = document.createElement('a');
  anchor.href = exportUrl.value;
  anchor.click();
  notify('Export started');
  close();
};

const close = () => {
  emit('update:visible', false);
  areUserGroupsIncluded.value = false;
};
</script>
