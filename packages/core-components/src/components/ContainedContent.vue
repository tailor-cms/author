<template>
  <v-col
    @mouseover="isHovered = true"
    @mouseleave="isHovered = false"
    @dragstart="$emit('dragstart')"
    @dragend="$emit('dragend')"
    @dragover="scrollContainer"
    :cols="elementWidth"
    :class="[{ disabled: isDisabled, hovered: isHovered }]"
    class="contained-content">
    <span v-if="!isDisabled" class="drag-handle">
      <span class="mdi mdi-drag-vertical"></span>
    </span>
    <content-element
      @add="$emit('add', $event)"
      @save="$emit('save', $event)"
      @save:meta="$emit('save:meta', $event)"
      @delete="$emit('delete')"
      v-bind="bindings" />
  </v-col>
</template>

<script>
import ContentElement from './ContentElement.vue';
import get from 'lodash/get';
import throttle from 'lodash/throttle';

export default {
  name: 'tailor-contained-content',
  inheritAttrs: false,
  props: {
    element: { type: Object, required: true },
    isDisabled: { type: Boolean, default: false },
    isDragged: { type: Boolean, default: false },
    setWidth: { type: Boolean, default: true },
    dense: { type: Boolean, default: false }
  },
  data: () => ({ isHovered: false }),
  computed: {
    bindings() {
      const {
        element, isDisabled, isDragged, isHovered, dense, $attrs: attrs
      } = this;
      return { element, isDisabled, isDragged, isHovered, dense, ...attrs };
    },
    elementWidth() {
      const { element, setWidth } = this;
      return setWidth ? get(element, 'data.width', 12) : undefined;
    }
  },
  methods: {
    scrollContainer: throttle(function (e) {
      const scrollUp = e.y < 200;
      const scrollDown = e.y > (window.innerHeight - 200);
      if (scrollUp || scrollDown) window.scrollBy(0, scrollUp ? -30 : 30);
    }, 20)
  },
  components: { ContentElement }
};
</script>

<style lang="scss" scoped>
.drag-handle {
  position: absolute;
  left: -3px;
  z-index: 2;
  width: 26px;
  opacity: 0;

  .mdi {
    color: #888;
    font-size: 28px;
  }
}

.hovered .drag-handle {
  opacity: 1;
  transition: opacity 0.6s ease-in-out;
  cursor: pointer;
}

.disabled .drag-handle {
  display: none;
}

.contained-content {
  position: relative;
  margin: 7px 0;
  padding: 0;
}
</style>
