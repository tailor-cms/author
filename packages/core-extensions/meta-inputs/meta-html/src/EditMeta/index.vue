<template>
  <RichTextEditor v-model="input" v-bind="meta" />
</template>

<script lang="ts" setup>
import type { Metadata } from '@tailor-cms/interfaces/schema';
import { ref } from 'vue';
import { RichTextEditor } from '@tailor-cms/core-components-next';

interface Meta extends Metadata {
  value?: string;
}

const props = defineProps<{ meta: Meta }>();

const input = ref(props.meta.value ?? '');
</script>
