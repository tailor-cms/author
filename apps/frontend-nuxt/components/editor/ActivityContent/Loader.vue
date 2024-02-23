<template>
  <VCard class="activity-content-loader">
    <div class="mb-3">
      <VSkeletonLoader class="justify-end" type="button" />
    </div>
    <div class="px-4">
      <VSkeletonLoader v-for="i in 2" :key="i" class="mb-3" type="image" />
    </div>
    <div class="mt-5">
      <VSkeletonLoader class="justify-center" type="button" />
    </div>
  </VCard>
</template>

<style lang="scss" scoped>
.activity-content-loader {
  padding: 1rem 1rem 1rem;
}
</style>
