<template>
  <VMenu location="bottom end">
    <template #activator="{ props: menuProps }">
      <VBtn
        v-bind="menuProps"
        color="primary-lighten-4"
        size="x-small"
        variant="text"
        @click.stop
      >
        View
        <VIcon end size="small">mdi-chevron-down</VIcon>
      </VBtn>
    </template>
    <VList class="overflow-y-auto" density="compact" max-height="300">
      <VListSubheader>
        {{ copies.length }} linked {{ pluralize('copy', copies.length) }}
      </VListSubheader>
      <VListItem
        v-for="copy in copies"
        :key="copy.uid"
        @click="$emit('select', copy)"
      >
        <template #prepend>
          <VIcon size="large">mdi-file-link-outline</VIcon>
        </template>
        <VListItemTitle class="text-body-medium">
          {{ copy.repositoryName }}
        </VListItemTitle>
        <VListItemSubtitle class="text-body-small">
          {{ copy.name }}
        </VListItemSubtitle>
      </VListItem>
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
  outlineActivityId: number;
  name: string;
}

defineProps<{ copies: Copy[] }>();
defineEmits<{ select: [copy: Copy] }>();
</script>
