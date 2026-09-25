<template>
  <div class="emoji-management text-left">
    <div class="d-flex align-center ga-3 mb-4">
      <VTextField
        v-model.trim="search"
        bg-color="transparent"
        density="comfortable"
        max-width="300"
        placeholder="Search emoji..."
        prepend-inner-icon="mdi-magnify"
        rounded="xl"
        variant="solo-filled"
        clearable
        flat
        hide-details
      />
      <VSpacer />
      <VBtn
        color="primary"
        prepend-icon="mdi-plus"
        text="Add emoji"
        variant="flat"
        @click="isDialogOpen = true"
      />
    </div>
    <VDataTable
      v-model:sort-by="sortBy"
      :headers="headers"
      :items="emojiStore.items"
      :items-per-page-options="[25, 50, 100, -1]"
      :loading="!emojiStore.isLoaded"
      :search="search ?? ''"
      class="bg-surface-raised rounded-lg elevation-1"
      filter-keys="name"
      item-value="id"
      items-per-page="25"
      hover
      must-sort
    >
      <template #[`item.url`]="{ item }">
        <img :alt="item.name" :src="item.url" class="tile">
      </template>
      <template #[`item.name`]="{ item }">
        <code class="shortcode">{{ toEmojiShortcode(item.name) }}</code>
      </template>
      <template #[`item.createdBy`]="{ item }">
        <div v-if="item.createdBy" class="d-flex align-center ga-2">
          <UserAvatar :img-url="item.createdBy.imgUrl ?? undefined" size="24" />
          {{ item.createdBy.label }}
        </div>
        <span v-else class="text-medium-emphasis">-</span>
      </template>
      <template #[`item.createdAt`]="{ item }">
        {{ formatDate(item.createdAt, 'MMM d, yyyy') }}
      </template>
      <template #[`item.actions`]="{ item }">
        <VBtn
          :aria-label="`Remove ${toEmojiShortcode(item.name)}`"
          color="error"
          density="comfortable"
          icon="mdi-trash-can-outline"
          size="small"
          variant="text"
          @click="confirmRemove(item)"
        />
      </template>
      <template #no-data>
        <TailorEmptyState
          v-bind="emptyState"
          variant="text"
          @click:action="search = ''"
        />
      </template>
    </VDataTable>
    <EmojiDialog v-model="isDialogOpen" />
  </div>
</template>

<script lang="ts" setup>
import type { DataTableHeader, DataTableSortItem } from 'vuetify';
import type { Emoji } from '@tailor-cms/api-client';

import { TailorEmptyState, UserAvatar } from '@tailor-cms/core-components';
import { formatDate } from 'date-fns/format';
import { toEmojiShortcode } from '@tailor-cms/utils';
import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useEmojiStore } from '@/stores/emoji';
import EmojiDialog from '@/components/admin/Emoji/EmojiDialog.vue';

definePageMeta({ name: 'emoji', middleware: ['has-admin-access'] });
useHead({ title: 'Emoji' });

const emojiStore = useEmojiStore();
const confirmationDialog = useConfirmationDialog();
const notify = useNotification();

const search = ref<string | null>('');
const isDialogOpen = ref(false);
const sortBy = ref<DataTableSortItem[]>([{ key: 'name', order: 'asc' }]);

const headers: DataTableHeader<Emoji>[] = [
  { title: 'Emoji', key: 'url', sortable: false, width: '5rem' },
  { title: 'Shortcode', key: 'name', sortable: true },
  {
    title: 'Added by',
    key: 'createdBy',
    value: (it: Emoji) => it.createdBy?.label ?? '',
    sortable: true,
  },
  { title: 'Added', key: 'createdAt', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end' },
];

const emptyState = computed(() =>
  search.value
    ? {
        actionText: 'Clear search',
        icon: 'mdi-magnify',
        prependActionIcon: 'mdi-close',
        text: 'No emoji match your search.',
        title: 'No matches',
      }
    : {
        icon: 'mdi-emoticon-outline',
        text: 'Emoji you add here can be used in messages.',
        title: 'No custom emoji yet',
      },
);

const confirmRemove = (emoji: Emoji) =>
  confirmationDialog({
    title: 'Remove emoji',
    color: 'error',
    message: `
      Remove ${toEmojiShortcode(emoji.name)}? Messages that used it \
      will show the shortcode as text.`,
    action: async () => {
      await emojiStore.remove(emoji.id);
      notify('Emoji removed');
    },
  });

onMounted(() => emojiStore.fetch());
</script>

<style lang="scss" scoped>
.tile {
  width: 2rem;
  height: 2rem;
  object-fit: contain;
}

.shortcode {
  font-size: 0.8125rem;
}
</style>
