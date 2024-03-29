<template>
  <tailor-dialog
    :key="isVisible"
    v-model="isVisible"
    header-icon="mdi-account"
    persistent>
    <template #activator="{ on }">
      <v-btn
        v-on="on"
        color="primary darken-3"
        text>
        <v-icon class="mr-2">mdi-account-plus</v-icon>Add User
      </v-btn>
    </template>
    <template #header>Add user</template>
    <template #body>
      <validation-observer
        ref="form"
        @submit.prevent="submit"
        tag="form"
        novalidate>
        <validation-provider
          v-slot="{ errors }"
          :rules="{ required: true, email: true, not_within: [users, 'email'] }"
          name="email"
          mode="lazy">
          <v-combobox
            v-model="email"
            @update:search-input="fetchUsers"
            :items="suggestedUsers"
            :error-messages="errors"
            label="Email"
            placeholder="Enter email..."
            outlined
            class="required" />
        </validation-provider>
        <validation-provider
          v-slot="{ errors }"
          name="role"
          rules="required">
          <v-select
            v-model="role"
            :items="roles"
            :error-messages="errors"
            label="Role"
            placeholder="Role..."
            outlined
            class="required" />
        </validation-provider>
        <div class="d-flex justify-end">
          <v-btn @click="close" :disabled="isSaving" text>Cancel</v-btn>
          <v-btn
            :disabled="isSaving"
            type="submit"
            color="primary darken-4"
            text>
            Add
          </v-btn>
        </div>
      </validation-observer>
    </template>
  </tailor-dialog>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { user as api } from '@/api';
import TailorDialog from '@/components/common/TailorDialog.vue';
import throttle from 'lodash/throttle';

function getDefaultData(roles) {
  return { email: '', role: roles[0].value };
}

export default {
  name: 'add-user-dialog',
  props: {
    roles: { type: Array, required: true }
  },
  data() {
    return {
      isVisible: false,
      isSaving: false,
      suggestedUsers: [],
      ...getDefaultData(this.roles)
    };
  },
  computed: mapGetters('repository', ['users']),
  methods: {
    ...mapActions('repository', ['upsertUser']),
    submit() {
      setTimeout(async () => {
        const isValid = await this.$refs.form.validate();
        if (!isValid) return;
        this.isSaving = true;
        const { email, role, $route: { params: { repositoryId } } } = this;
        await this.upsertUser({ repositoryId, email, role });
        this.suggestedUsers = [];
        this.isSaving = false;
        this.close();
      });
    },
    fetchUsers: throttle(async function (filter) {
      if (!filter || (filter.length < 2)) {
        this.suggestedUsers = [];
        return;
      }
      const { items: users } = await api.fetch({ filter });
      this.suggestedUsers = users.map(it => it.email);
    }, 350),
    close() {
      this.isVisible = false;
      Object.assign(this, getDefaultData(this.roles));
    }
  },
  components: { TailorDialog }
};
</script>
