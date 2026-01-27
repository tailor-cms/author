<template>
  <span>{{ resolvedName }}</span>
</template>

<script lang="ts" setup>
interface Props {
  activity: { data?: Record<string, any> };
}

const props = defineProps<Props>();

const { $pluginRegistry } = useNuxtApp() as any;

const resolvedName = computed(() => {
  const data = props.activity?.data;
  if (!data) return '';
  const rawValue = data.name ?? '';
  const result = $pluginRegistry.filter('data:value', rawValue, { data, key: 'name' });
  return result ?? rawValue;
});
</script>
