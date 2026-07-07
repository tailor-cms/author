<template>
  <VSelect v-bind="$attrs" item-title="label" item-value="id">
    <template #selection="{ item }">
      <VAvatar :image="item.imgUrl" class="mr-4" size="26" />
      {{ item.label }}
    </template>
    <template #item="{ item, props: selectionProps }">
      <VListItem v-bind="selectionProps">
        <template #prepend>
          <VAvatar :image="item.imgUrl" size="26" />
        </template>
      </VListItem>
    </template>
  </VSelect>
</template>
