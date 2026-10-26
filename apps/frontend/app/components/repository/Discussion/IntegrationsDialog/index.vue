<template>
  <TailorDialog
    v-model="isOpen"
    header-icon="mdi-webhook"
    title="Integrations"
    width="560"
    closeable
    scrollable
  >
    <template #body>
      <VSkeletonLoader
        v-if="isLoading"
        color="transparent"
        type="list-item-avatar-two-line@3"
      />
      <template v-else>
        <section class="mt-n2">
          <div class="d-flex align-center ga-2 mb-3">
            <div>
              <h3 class="group-label text-body-medium">Webhooks</h3>
              <div class="text-body-small text-medium-emphasis">
                Outside systems post into this discussion through their own URL.
              </div>
            </div>
            <VSpacer />
            <VBtn
              prepend-icon="mdi-plus"
              color="primary"
              variant="flat"
              text="Register"
              @click="isRegisterOpen = true"
            />
          </div>
          <VList
            v-if="external.length"
            bg-color="transparent"
            class="d-flex flex-column ga-1 py-0"
          >
            <IntegrationRow
              v-for="integration in external"
              :key="integration.id"
              :integration="integration"
              @revoke:integration="confirmRevoke"
            />
          </VList>
          <TailorEmptyState
            v-else
            :text="EMPTY_HINT"
            icon="mdi-webhook"
            title="No webhooks yet"
            variant="tonal"
          />
        </section>
        <section v-if="builtin.length" class="mt-4 mb-3">
          <h3 class="group-label text-body-medium">Built-in</h3>
          <div class="text-body-small text-medium-emphasis mb-2">
            Tailor posts its own activity, one sender per topic.
          </div>
          <VList bg-color="transparent" class="d-flex flex-column ga-1 py-0">
            <IntegrationRow
              v-for="integration in builtin"
              :key="integration.id"
              :integration="integration"
            />
          </VList>
        </section>
      </template>
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
import { TailorDialog, TailorEmptyState } from '@tailor-cms/core-components';

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
  Anything that can send a Slack-style JSON payload can post here, like a CI
  pipeline or an alerting tool.`;

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

<style lang="scss" scoped>
.group-label {
  font-weight: 600;
}
</style>
