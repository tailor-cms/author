<template>
  <TailorDialog
    v-model="isOpen"
    header-icon="mdi-bell-outline"
    title="Subscribe to updates"
    width="520"
    scrollable
  >
    <template #subheader>
      <div class="text-body-medium text-medium-emphasis px-5 pb-2">
        Nothing posts here unless you ask for it. Select what should be
        reported into this thread.
      </div>
    </template>
    <template #body>
      <div v-if="isLoading" class="d-flex justify-center py-6">
        <VProgressCircular color="primary" indeterminate size="24" />
      </div>
      <template v-else>
        <VCheckbox
          v-for="option in topics"
          :key="option.topic"
          v-model="selected"
          :value="option.topic"
          density="compact"
          hide-details
        >
          <template #label>
            <div>
              <div class="text-body-medium">{{ option.label }}</div>
              <div class="text-body-small text-medium-emphasis">
                {{ option.description }}
              </div>
            </div>
          </template>
        </VCheckbox>
      </template>
    </template>
    <template #actions>
      <VSpacer />
      <VBtn text="Cancel" variant="text" @click="isOpen = false" />
      <VBtn
        :loading="isSaving"
        color="primary"
        text="Save"
        variant="flat"
        @click="save"
      />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { TailorDialog } from '@tailor-cms/core-components';

import { useMessagingStore } from '@/stores/messaging';

interface Topic {
  topic: string;
  label: string;
  description: string;
}

const props = defineProps<{
  repositoryId: number;
  threadId: number;
  subscriptions: string[];
}>();

const emit = defineEmits<{ saved: [topics: string[]] }>();

const isOpen = defineModel<boolean>({ default: false });

const messagingStore = useMessagingStore();

const topics = ref<Topic[]>([]);
const selected = ref<string[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);

const save = async () => {
  isSaving.value = true;
  try {
    const { repositoryId, threadId } = props;
    await messagingStore.setSubscriptions(
      repositoryId,
      threadId,
      selected.value,
    );
    emit('saved', selected.value);
    isOpen.value = false;
  } finally {
    isSaving.value = false;
  }
};

// Loaded once, when first opened
watch(isOpen, async (open) => {
  if (!open) return;
  selected.value = [...props.subscriptions];
  if (topics.value.length) return;
  isLoading.value = true;
  try {
    topics.value = await messagingStore.fetchSubscriptionTopics(
      props.repositoryId,
    );
  } finally {
    isLoading.value = false;
  }
});
</script>
