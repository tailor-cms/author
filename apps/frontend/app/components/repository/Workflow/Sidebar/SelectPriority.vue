<template>
  <VSelect v-bind="$attrs" item-title="label" item-value="id">
    <template #selection="{ item }">
      <VIcon :color="item.color" :icon="item.icon" class="mr-5" />
      {{ item.label }}
    </template>
    <template #item="{ item, props: selectionProps }">
      <VListItem v-bind="selectionProps" slim>
        <template #prepend>
          <VIcon :color="item.color" :icon="item.icon" />
        </template>
      </VListItem>
    </template>
  </VSelect>
</template>
