<template>
  <TailorDialog
    v-model="isDialogVisible"
    header-icon="mdi-account-group"
    persistent
  >
    <template #header>{{ isNewGroup ? 'Create' : 'Edit' }} User Group</template>
    <template #body>
      <form class="form" novalidate @submit.prevent="submit">
        <div class="d-flex justify-center mt-2 mb-7">
          <GroupAvatar
            :img-url="logoUrlInput"
            @save="onAvatarSave"
            @delete="onAvatarSave('')"
          />
        </div>
        <VTextField
          v-model="nameInput"
          :error-messages="errors.name"
          class="mb-3 required"
          label="Group name"
          placeholder="Enter group name..."
          variant="outlined"
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
import { object, string } from 'yup';
import isEmpty from 'lodash/isEmpty';
import { TailorDialog } from '@tailor-cms/core-components';
import { useForm } from 'vee-validate';

import GroupAvatar from '@/components/common/Avatar/index.vue';

import { userGroup as api } from '@/api';

export interface Props {
  visible?: boolean;
  groupData?: any;
  userGroups: any[];
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  groupData: {},
});

const emit = defineEmits(['created', 'updated', 'update:visible']);

const isDialogVisible = computed({
  get: () => props.visible,
  set(value) {
    if (!value) close();
  },
});

const isNewGroup = computed(() => !props.groupData?.id);

const onAvatarSave = (imgUrl: string) => {
  logoUrlInput.value = imgUrl;
};

const { defineField, errors, handleSubmit, resetForm, setFieldError } = useForm(
  {
    validationSchema: object({
      name: string().min(2).max(250).required(),
      logoUrl: string(),
    }),
  },
);

const [nameInput] = defineField('name');
const [logoUrlInput] = defineField('logoUrl');

watch(isDialogVisible, (val) => {
  if (!val) return;
  if (!isEmpty(props.groupData)) {
    nameInput.value = props.groupData.name;
    logoUrlInput.value = props.groupData.logoUrl;
  } else {
    resetForm();
  }
});

const close = () => {
  emit('update:visible', false);
  resetForm();
};

const submit = handleSubmit(async () => {
  const action = isNewGroup.value ? 'create' : 'update';
  try {
    await api[action]({
      id: props.groupData?.id,
      name: nameInput.value,
      logoUrl: logoUrlInput.value,
    });
  } catch (e: any) {
    const { message } = e?.response?.data?.error || {};
    setFieldError('name', message || 'An error occurred!');
    return;
  }
  emit(`${action}d`);
  close();
});
</script>
