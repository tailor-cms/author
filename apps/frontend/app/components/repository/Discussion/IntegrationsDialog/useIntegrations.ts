import type {
  Integration,
  MessagingCreateIntegrationData,
} from '@tailor-cms/api-client';
import type { MaybeRefOrGetter } from 'vue';
import { api } from '@/api';
import { IntegrationType } from '@tailor-cms/interfaces/comment';

export type { Integration };
export type RegisterInput = MessagingCreateIntegrationData['body'];

export interface IssuedIntegration {
  integration: Integration;
  webhookUrl: string;
}

export function useIntegrations(repositoryId: MaybeRefOrGetter<number>) {
  const items = ref<Integration[]>([]);
  const isLoading = ref(false);
  const isSaving = ref(false);

  const scope = () => ({ repositoryId: toValue(repositoryId) });

  const external = computed(() =>
    items.value.filter((it) => it.type === IntegrationType.External),
  );

  const builtin = computed(() =>
    items.value.filter((it) => it.type === IntegrationType.Builtin),
  );

  const load = async () => {
    isLoading.value = true;
    try {
      items.value = await api.messaging.getIntegrations({ params: scope() });
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (input: RegisterInput): Promise<IssuedIntegration> => {
    isSaving.value = true;
    try {
      const { token, webhookUrl, ...integration } =
        await api.messaging.createIntegration({
          params: scope(),
          body: input,
        });
      items.value = [...items.value, integration];
      return { integration, webhookUrl };
    } finally {
      isSaving.value = false;
    }
  };

  const revoke = async (integrationId: number) => {
    await api.messaging.removeIntegration({
      params: { ...scope(), integrationId },
    });
    items.value = items.value.filter((it) => it.id !== integrationId);
  };

  return { external, builtin, isLoading, isSaving, load, register, revoke };
}
