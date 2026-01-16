<template>
  <div>
    <VTabs>
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
