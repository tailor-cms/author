<template>
  <tailor-dialog :value="show" header-icon="mdi-content-copy" persistent>
    <template #header>Clone {{ schema.toLowerCase() }}</template>
    <template #body>
      <validation-observer
        ref="form"
        @submit.prevent="$refs.form.handleSubmit(submit)"
        tag="form"
        novalidate>
        <validation-provider
          v-slot="{ errors }"
          name="name"
          rules="required|min:2|max:250">
          <v-text-field
            v-model="name"
            :error-messages="errors"
            :disabled="inProgress"
            label="Name"
            placeholder="Enter name..."
            outlined
            class="required mb-4" />
        </validation-provider>
        <validation-provider
          v-slot="{ errors }"
          name="description"
          rules="required|min:2|max:2000">
          <v-textarea
            v-model="description"
            :error-messages="errors"
            :disabled="inProgress"
            label="Description"
            placeholder="Enter description..."
            outlined
            class="required mb-4" />
        </validation-provider>
        <div class="d-flex justify-end">
          <v-btn @click="close" :disabled="inProgress" text>Cancel</v-btn>
          <v-btn
            :loading="inProgress"
            type="submit"
            color="primary darken-4"
            text>
            Clone
          </v-btn>
        </div>
      </validation-observer>
    </template>
  </tailor-dialog>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import pick from 'lodash/pick';
import TailorDialog from '@/components/common/TailorDialog.vue';

const getDefaultState = () => ({
  inProgress: false,
  name: '',
  description: ''
});

export default {
  props: {
    show: { type: Boolean, default: true }
  },
  data: () => getDefaultState(),
  computed: mapGetters('repository', ['schema']),
  methods: {
    ...mapActions('repositories', ['clone']),
    close() {
      this.$emit('close');
      Object.assign(this, getDefaultState());
      this.$refs.form.reset();
    },
    async submit() {
      this.inProgress = true;
      const { repositoryId } = this.$route.params;
      const data = { id: repositoryId, ...pick(this, ['name', 'description']) };
      await this.clone(data);
      this.close();
    }
  },
  components: { TailorDialog }
};
</script>
