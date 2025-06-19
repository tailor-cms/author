<template>
  <div class="py-2 pr-4">
    <VTabs class="mx-4">
      <VTab :to="{ name: 'repository-settings-users' }">
        Users
      </VTab>
      <VTab :to="{ name: 'repository-settings-groups' }">
        Groups
      </VTab>
    </VTabs>
    <NuxtPage />
  </div>
</template>
