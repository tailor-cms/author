<template>
  <TailorDialog
    v-model="isOpen"
    header-icon="mdi-webhook"
    title="Integrations"
    width="620"
    scrollable
  >
    <template #subheader>
      <div class="text-body-medium text-medium-emphasis px-5 pb-2">
        Let outside systems post into this discussion through a webhook.
      </div>
    </template>
    <template #body>
      <VSkeletonLoader
        v-if="isLoading"
        color="transparent"
        type="list-item-avatar-two-line@3"
      />
      <VList v-else bg-color="transparent" class="py-0">
        <VListSubheader title="Registered" />
        <IntegrationRow
          v-for="integration in external"
          :key="integration.id"
          :integration="integration"
          @revoke:integration="confirmRevoke"
        />
        <VEmptyState
          v-if="!external.length"
          :text="EMPTY_HINT"
          icon="mdi-webhook"
          size="40"
          title="Nothing registered yet"
        />
        <template v-if="builtin.length">
          <VListSubheader class="mt-2" title="Built-in" />
          <IntegrationRow
            v-for="integration in builtin"
            :key="integration.id"
            :integration="integration"
          />
        </template>
      </VList>
    </template>
    <template #actions>
      <VBtn
        color="primary"
        prepend-icon="mdi-plus"
        text="Register integration"
        variant="tonal"
        @click="isRegisterOpen = true"
      />
      <VSpacer />
      <VBtn text="Close" variant="text" @click="isOpen = false" />
    </template>
  </TailorDialog>
  <RegisterDialog
    v-model="isRegisterOpen"
    :existing-keys="existingKeys"
    :is-saving="isSaving"
    :issued="issued"
    @close="issued = null"
    @register:integration="onRegister"
  />
</template>

<script lang="ts" setup>
import { TailorDialog } from '@tailor-cms/core-components';

import type {
  Integration,
  IssuedIntegration,
  RegisterInput,
} from './useIntegrations';
import IntegrationRow from './IntegrationRow.vue';
import RegisterDialog from './RegisterDialog.vue';
import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useIntegrations } from './useIntegrations';

const EMPTY_HINT = `
  Anything that can send a Slack-style JSON payload - a CI pipeline, an
  alerting tool....`;

const props = defineProps<{ repositoryId: number }>();

const isOpen = defineModel<boolean>({ default: false });

const notify = useNotification();
const confirmationDialog = useConfirmationDialog();

const { external, builtin, isLoading, isSaving, load, register, revoke } =
  useIntegrations(() => props.repositoryId);

const isRegisterOpen = ref(false);

const issued = ref<IssuedIntegration | null>(null);

const existingKeys = computed(() =>
  [...external.value, ...builtin.value].map((it) => it.key),
);

const onRegister = async (input: RegisterInput) => {
  try {
    issued.value = await register(input);
  } catch (error: any) {
    const isTaken = error?.response?.status === 409;
    notify(
      isTaken
        ? `The key "${input.key}" is already taken`
        : 'We couldn\'t register the integration',
      { color: 'error' },
    );
  }
};

const confirmRevoke = (integration: Integration) => {
  confirmationDialog({
    title: 'Revoke integration',
    color: 'error',
    message: `
      Revoke "${integration.name}"? Its webhook URL stops working right
      away; messages it already posted stay.`,
    action: async () => {
      await revoke(integration.id);
      notify(`${integration.name} revoked`);
    },
  });
};

watch(isOpen, (open) => {
  if (open) load();
});
</script>
