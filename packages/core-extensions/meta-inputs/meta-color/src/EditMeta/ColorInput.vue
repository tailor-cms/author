<template>
  <VMenu v-model="menu" :close-on-content-click="false">
    <template #activator="{ props: menuProps }">
      <VHover v-slot="{ isHovering, props: hoverProps }">
        <VBtn
          v-bind="{ ...menuProps, ...hoverProps }"
          :color="color"
          class="picker ml-1 mr-3"
          icon
        >
          <VFadeTransition>
            <VIcon v-if="isHovering" icon="mdi-eyedropper" />
          </VFadeTransition>
        </VBtn>
      </VHover>
    </template>
    <VCard>
      <VColorPicker
        :model-value="color"
        :modes="['hex']"
        elevation="0"
        mode="hex"
        width="250"
        @update:model-value="color = $event"
      />
      <VCardActions>
        <VSpacer />
        <VBtn
          :slim="false"
          color="primary-darken-4"
          size="small"
          variant="text"
          @click="menu = false"
        >
          Cancel
        </VBtn>
        <VBtn
          :slim="false"
          color="primary-darken-3"
          size="small"
          variant="tonal"
          @click="submit"
        >
          Submit
        </VBtn>
      </VCardActions>
    </VCard>
  </VMenu>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';

const props = defineProps<{ color: string }>();
const emit = defineEmits(['input']);

const menu = ref(false);
const color = ref(props.color || '#ffffff');

const submit = () => {
  emit('input', color.value);
  menu.value = false;
};

watch(
  () => props.color,
  (value) => (color.value = value),
);
</script>

<style lang="scss" scoped>
.picker {
  margin-top: 3px;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 15%);
}
</style>
