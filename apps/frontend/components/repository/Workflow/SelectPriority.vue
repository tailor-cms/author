<template>
  <VSelect v-bind="$attrs" item-title="label" item-value="id">
    <template #selection="{ item }">
      <VIcon :color="item.raw.color" :icon="item.raw.icon" class="mr-4" />
      {{ item.title }}
    </template>
    <template #item="{ item, props: selectionProps }">
      <VListItem v-bind="selectionProps" slim>
        <template #prepend>
          <VIcon :color="item.raw.color" :icon="item.raw.icon" />
        </template>
      </VListItem>
    </template>
  </VSelect>
</template>
