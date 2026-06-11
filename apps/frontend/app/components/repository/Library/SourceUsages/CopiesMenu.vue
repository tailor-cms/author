<template>
  <VMenu location="bottom end">
    <template #activator="{ props: menuProps }">
      <VBtn
        v-bind="menuProps"
        append-icon="mdi-chevron-down"
        size="small"
        text="View"
        variant="text"
        @click.stop
      />
    </template>
    <VList class="overflow-y-auto" density="compact" max-height="300" nav>
      <VListSubheader>
        {{ copies.length }} linked {{ pluralize('copy', copies.length) }}
      </VListSubheader>
      <VListItem
        v-for="copy in copies"
        :key="copy.uid"
        :title="copy.repositoryName"
        :subtitle="copy.name"
        prepend-icon="mdi-file-link-outline"
        @click="$emit('select', copy)"
      />
    </VList>
  </VMenu>
</template>

<script lang="ts" setup>
import pluralize from 'pluralize-esm';

export interface Copy {
  id: number;
  uid: string;
  repositoryId: number;
  repositoryName: string;
  outlineActivityId?: number;
  name?: string;
}

defineProps<{ copies: Copy[] }>();
defineEmits<{ select: [copy: Copy] }>();
</script>
