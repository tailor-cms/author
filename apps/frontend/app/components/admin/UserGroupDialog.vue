<template>
  <TailorDialog
    v-model="isDialogVisible"
    :title="`${isNewGroup ? 'Create' : 'Edit'} User Group`"
    header-icon="mdi-account-group"
    persistent
    @submit="submit"
  >
    <template #body>
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
    </template>
    <template #actions>
      <VBtn text="Cancel" variant="text" @click="close" />
      <VBtn
        :disabled="!!errors?.length"
        color="primary"
        text="Save"
        type="submit"
        variant="flat"
      />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { object, string } from 'yup';
import { isEmpty } from 'lodash-es';
import { TailorDialog } from '@tailor-cms/core-components';
import { useForm } from 'vee-validate';

import { api } from '@/api';
import GroupAvatar from '@/components/common/Avatar/index.vue';

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
      logoUrl: string().nullable(),
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
  const body = {
    name: nameInput.value || undefined,
    logoUrl: logoUrlInput.value || undefined,
  };
  let group;
  try {
    group = isNewGroup.value
      ? await api.userGroup.create({ body })
      : await api.userGroup.update({
          params: { id: props.groupData.id },
          body,
        });
  } catch (e: any) {
    const { message } = e?.response?.data?.error || {};
    setFieldError('name', message || 'An error occurred!');
    return;
  }
  emit(`${action}d`, group);
  close();
});
</script>
