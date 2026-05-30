<template>
  <VMenu v-model="menu" :close-on-content-click="false">
    <template #activator="{ props: menuProps }">
      <VHover v-slot="{ isHovering, props: hoverProps }">
        <VBtn
          v-bind="{ ...menuProps, ...hoverProps }"
          :color="color"
          :readonly="readonly"
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
          text="Cancel"
          variant="text"
          @click="menu = false"
        />
        <VBtn
          :slim="false"
          text="Submit"
          variant="tonal"
          @click="submit"
        />
      </VCardActions>
    </VCard>
  </VMenu>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';

const props = defineProps<{ color: string; readonly: boolean }>();
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
