<template>
  <NavigationRail :tabs="tabs" class="admin-rail" />
</template>

<script lang="ts" setup>
import NavigationRail, {
  type RailTab,
} from '@/components/common/NavigationRail/index.vue';

const route = useRoute();

const tabs = computed<RailTab[]>(() => {
  const { query } = route;
  return [
    {
      key: 'users',
      label: 'Users',
      icon: 'account-outline',
      activeIcon: 'account',
      to: { name: 'system-user-management', query },
    },
    {
      key: 'groups',
      label: 'Groups',
      icon: 'account-group-outline',
      activeIcon: 'account-group',
      to: { name: 'user-groups', query },
      matches: (name) => ['user-groups', 'user-group'].includes(name),
    },
    {
      key: 'structures',
      label: 'Structures',
      icon: 'file-tree-outline',
      activeIcon: 'file-tree',
      to: { name: 'installed-schemas', query },
    },
    {
      key: 'elements',
      label: 'Elements',
      icon: 'puzzle-outline',
      activeIcon: 'puzzle',
      to: { name: 'installed-elements', query },
    },
    {
      key: 'emoji',
      label: 'Emoji',
      icon: 'emoticon-outline',
      activeIcon: 'emoticon',
      to: { name: 'emoji', query },
    },
  ];
});
</script>
