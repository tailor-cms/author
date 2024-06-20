<template>
  <TailorDialog v-model="isVisible" header-icon="mdi-account" persistent>
    <template #activator="{ props }">
      <VBtn
        v-bind="props"
        aria-label="Add user"
        class="add-user"
        color="primary-darken-2"
        prepend-icon="mdi-plus"
        size="small"
        variant="tonal"
      >
        Add user
      </VBtn>
    </template>
    <template #header>Add user</template>
    <template #body>
      <form novalidate @submit.prevent="submit">
        <VCombobox
          v-model="emailInput"
          :error-messages="errors.email"
          :items="suggestedUsers"
          class="required mb-4"
          item-title="email"
          item-value="email"
          label="Email"
          placeholder="Enter email..."
          variant="outlined"
          @update:search="fetchUsers"
        />
        <VSelect
          v-model="roleInput"
          :error-messages="errors.role"
          :items="roles"
          aria-label="Role"
          class="role-select required my-4"
          label="Role"
          placeholder="Role..."
          variant="outlined"
        />
        <div class="d-flex justify-end pb-2">
          <VBtn
            :disabled="isSaving"
            class="mr-2"
            color="primary-darken-4"
            variant="text"
            @click="close"
          >
            Cancel
          </VBtn>
          <VBtn
            :disabled="isSaving"
            color="primary-darken-4"
            type="submit"
            variant="tonal"
          >
            Add
          </VBtn>
        </div>
      </form>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { object, string } from 'yup';
import throttle from 'lodash/throttle';
import { useForm } from 'vee-validate';

import { user as api } from '~/api';
import TailorDialog from '@/components/common/TailorDialog.vue';
import { useCurrentRepository } from '@/stores/current-repository';

defineProps({
  roles: { type: Array, required: true },
});

const store = useCurrentRepository();

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: object({
    email: string()
      .required()
      .email()
      .notOneOf(store.users.map((user) => user.email)),
    role: string().required(),
  }),
});

const [emailInput] = defineField('email');
const [roleInput] = defineField('role');

const isVisible = ref(false);
const isSaving = ref(false);
const suggestedUsers = ref([]);

const close = () => {
  isVisible.value = false;
  resetForm();
};

const submit = handleSubmit(async () => {
  isSaving.value = true;
  await store.upsertUser(emailInput.value, roleInput.value);
  suggestedUsers.value = [];
  isSaving.value = false;
  close();
});

const fetchUsers = throttle(async (filter) => {
  if (!filter || filter.length < 2) {
    suggestedUsers.value = [];
    return;
  }
  const { items: users } = await api.fetch({ filter });
  suggestedUsers.value = users.map((it: any) => it.email);
}, 350);
</script>
