<template>
  <VSelect v-bind="$attrs" item-title="label" item-value="id">
    <template #selection="{ item }">
      <div class="selection d-flex flex-nowrap">
        <VIcon :color="item.raw.color" class="mr-4" icon="mdi-circle" small />
        {{ item.title }}
      </div>
    </template>
    <template #item="{ item, props: selectionProps }">
      <VListItem v-bind="selectionProps" slim>
        <template #prepend>
          <VIcon :color="item.raw.color" icon="mdi-circle" small />
        </template>
      </VListItem>
    </template>
  </VSelect>
</template>

<style lang="scss" scoped>
.selection {
  max-width: 100%;
}
</style>
