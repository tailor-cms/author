<template>
  <element-list
    @add="addItems"
    @update="reorderItem"
    :add-element-options="addElementOptions"
    :elements="embeds"
    :supported-types="types"
    :enable-add="!isDisabled && enableAdd">
    <template #list-item="{ element, isDragged }">
      <contained-content
        @save="save(element, 'data', $event)"
        @save:meta="save(element, 'meta', $event)"
        @delete="requestDeleteConfirmation(element)"
        :element="element"
        :is-dragged="isDragged"
        :is-disabled="isDisabled"
        v-bind="$attrs"
        class="my-2" />
    </template>
  </element-list>
</template>

<script>
import { calculatePosition } from '@tailor-cms/utils';
import cloneDeep from 'lodash/cloneDeep';
import ContainedContent from './ContainedContent.vue';
import ElementList from './ElementList.vue';
import mapKeys from 'lodash/mapKeys';
import { mapRequests } from '@extensionengine/vue-radio';
import values from 'lodash/values';

export default {
  name: 'tailor-embedded-container',
  inheritAttrs: false,
  props: {
    container: { type: Object, required: true },
    types: { type: Array, default: () => ['JODIT_HTML', 'IMAGE', 'HTML', 'VIDEO'] },
    isDisabled: { type: Boolean, default: false },
    addElementOptions: { type: Object, default: () => ({}) },
    enableAdd: { type: Boolean, default: true }
  },
  computed: {
    embeds() {
      const items = this.container.embeds;
      return items ? values(items).sort((a, b) => a.position - b.position) : [];
    }
  },
  methods: {
    ...mapRequests('app', ['showConfirmationModal']),
    addItems(items) {
      items = Array.isArray(items) ? items : [items];
      const container = cloneDeep(this.container);
      container.embeds = { ...container.embeds, ...mapKeys(items, 'id') };
      this.$emit('save', container);
    },
    reorderItem({ newPosition, items }) {
      const context = { items, newPosition };
      const container = cloneDeep(this.container);
      const reordered = container.embeds[items[newPosition].id];
      reordered.position = calculatePosition(context);
      this.$emit('save', container);
    },
    save(item, key, value) {
      const container = cloneDeep(this.container);
      container.embeds[item.id] = { ...item, [key]: value };
      this.$emit('save', container);
    },
    requestDeleteConfirmation(element) {
      this.showConfirmationModal({
        title: 'Delete element?',
        message: 'Are you sure you want to delete element?',
        action: () => this.$emit('delete', element)
      });
    }
  },
  components: { ContainedContent, ElementList }
};
</script>
