<template>
  <TailorDialog v-model="isVisible" header-icon="mdi-account" persistent>
    <template #activator="{ props: activatorProps }">
      <VBtn
        v-bind="activatorProps"
        aria-label="Add user group"
        class="add-user"
        color="primary-darken-2"
        prepend-icon="mdi-plus"
        size="small"
        variant="tonal"
      >
        Add user group
      </VBtn>
    </template>
    <template #header>Assosciate user group</template>
    <template #body>
      <form class="form" novalidate @submit.prevent="submit">
        <VSelect
          v-model="groupInput"
          :error-messages="errors.userGroupIds"
          :items="groupOptions"
          :return-object="false"
          class="user-group-select mb-3"
          item-title="name"
          item-value="id"
          label="User Group"
          no-data-text="No user groups available"
          placeholder="Select user group..."
          variant="outlined"
          chips
          clearable
          closable-chips
        />
        <div class="d-flex justify-end pb-3">
          <VBtn color="primary-darken-4" variant="text" @click="close">
            Cancel
          </VBtn>
          <VBtn
            :disabled="!!errors?.length"
            class="ml-2 px-4"
            color="primary-darken-2"
            type="submit"
            variant="tonal"
          >
            Save
          </VBtn>
        </div>
      </form>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { TailorDialog } from '@tailor-cms/core-components';
import { useForm } from 'vee-validate';

import repositoryApi from '@/api/repository.js';

export interface Props {
  userGroups: any;
}

const props = withDefaults(defineProps<Props>(), {
  userGroups: [],
});

const authStore = useAuthStore();
const repositoryStore = useRepositoryStore();
const currentRepositoryStore = useCurrentRepository();

const isVisible = ref(false);

const { defineField, errors, handleSubmit, resetForm } = useForm({});
const [groupInput] = defineField('userGroupIds');
const groupOptions = ref([]) as any;

const submit = handleSubmit(async () => {
  const repositoryId = currentRepositoryStore.repositoryId as number;
  await repositoryApi.addUserGroup({
    repositoryId,
    userGroupId: groupInput.value,
  });
  await repositoryStore.get(repositoryId);
  close();
});

const close = () => {
  isVisible.value = false;
  resetForm();
};

watch(isVisible, (val) => {
  if (!val) return;
  const assignedGroups = props.userGroups;
  const storeGroups = authStore.userGroups;
  groupOptions.value = props.userGroups?.length
    ? storeGroups.filter((sg) => !assignedGroups.find((ag: any) => sg.id === ag.id))
    : storeGroups;
  resetForm();
});
</script>
