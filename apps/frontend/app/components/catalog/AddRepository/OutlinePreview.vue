<template>
  <div v-if="items.length">
    <div class="my-4 text-body-2 font-weight-bold">Suggested outline:</div>
    <VueTreeView
      :hide-guide-lines="false"
      :is-checkable="false"
      :items="items"
      class="explorer-container mb-8"
    />
  </div>
</template>

<script lang="ts" setup>
import VueTreeView from 'vue3-tree-vue';

defineProps<{
  items: any[];
}>();
</script>

<style lang="scss">
// vue3-tree-vue copied styles
.explorer-container {
  .tree-item:hover .on-item-hover {
    display: block;
  }

  .tree-item .on-item-hover {
    display: none;
  }

  .tree-item-node:hover li > .on-item-hover {
    display: block;
  }

  .tree-item-node li > .on-item-hover {
    display: none;
  }

  .tree-item {
    padding: 0.25em;
  }

  ul {
    padding-left: 0;
    margin: 0;
    list-style-type: none;
    display: inline-block;
  }

  li {
    border-radius: 4px;
  }

  .tree-item__drag-over {
    background-color: rgba(22, 22, 22, 0.068) !important;
  }

  .root__drag-over {
    border-left: 6px solid #ccc !important;
  }

  .chevron-right {
    color: gray;
  }

  .hide-chevron {
    visibility: collapse;
  }

  .icon-area {
    width: 1.375rem;
    margin-right: 0.4em;
  }

  .guide-line {
    width: 1em;
    border-top: 1px dashed rgb(192, 192, 192);
  }

  .node-name {
    cursor: pointer;
    margin-left: 5px;
  }

  .d-flex {
    display: flex;
    align-items: center;
  }

  .align-items-center {
    align-items: center;
  }

  .nested {
    margin-left: 3rem !important;
  }

  .root {
    margin-left: 1.875rem !important;
  }

  .tiny_horizontal_margin {
    margin-left: 2px;
    margin-right: 2px;
  }

  .tree-item__checkbox-area {
    display: flex;
    align-items: center;
  }

  .node-child {
    text-align: left;
    display: block;
    border-left: 1px dashed rgb(192, 192, 192);
  }

  .hide {
    display: none;
  }

  .hide-guidelines {
    border-left: none !important;
  }

  .chevron-right {
    box-sizing: border-box;
    position: relative;
    display: block;
    transform: scale(var(--ggs, 1));
    width: 1.375rem;
    height: 1.375rem;
    border: 0.125rem solid transparent;
    border-radius: 100px;
    transition: 0.2s;
  }

  .pointer {
    cursor: pointer;
  }

  .chevron-right.rotate-90::after {
    transform: rotateZ(45deg);
  }

  .chevron-right::after {
    content: '';
    display: block;
    box-sizing: border-box;
    position: absolute;
    width: 7px;
    height: 7px;
    border-bottom: 2px solid;
    border-right: 2px solid;
    transform: rotate(-45deg);
    right: 6px;
    top: 5px;
  }
}
</style>
