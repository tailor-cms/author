<template>
  <VSelect v-bind="$attrs" item-title="label" item-value="id">
    <template #selection="{ item }">
      <VIcon
        :color="item.raw.color"
        class="mr-5"
        icon="mdi-circle"
        size="small"
      />
      {{ item.title }}
    </template>
    <template #item="{ item, props: selectionProps }">
      <VListItem v-bind="selectionProps" slim>
        <template #prepend>
          <VIcon :color="item.raw.color" icon="mdi-circle" size="small" />
        </template>
      </VListItem>
    </template>
  </VSelect>
</template>
