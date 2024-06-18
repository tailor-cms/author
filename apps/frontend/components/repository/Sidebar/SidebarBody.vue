<template>
  <div class="body">
    <VSheet class="d-flex align-center my-5 pa-1" color="transparent">
      <div class="d-flex align-center mr-1 text-body-2 font-weight-bold">
        <VIcon :color="config.color" class="mr-2" size="26">mdi-label</VIcon>
        <span>{{ config.label.toUpperCase() }}</span>
      </div>
      <VDivider class="my-2 ml-3" vertical />
      <VTooltip location="bottom" open-delay="100">
        <template #activator="{ props: tooltipProps }">
          <LabelChip
            v-bind="tooltipProps"
            color="primary-lighten-5"
            density="compact"
          >
            {{ activity.shortId }}
          </LabelChip>
        </template>
        {{ config.label }} ID
      </VTooltip>
      <VSpacer />
      <VBtn
        :key="activityUrl"
        v-clipboard:copy="activity.shortId"
        v-clipboard:error="() => notify('Not able to copy the ID')"
        v-clipboard:success="
          () => notify('ID copied to the clipboard', { immediate: true })
        "
        class="mr-2 px-4"
        color="primary-lighten-3"
        size="small"
        variant="tonal"
      >
        <VIcon class="mr-1" small>mdi-content-copy</VIcon>
        <VIcon dense>mdi-identifier</VIcon>
      </VBtn>
      <VBtn
        :key="activityUrl"
        v-clipboard:copy="activityUrl"
        v-clipboard:error="() => notify('Not able to copy the link')"
        v-clipboard:success="
          () => notify('Link copied to the clipboard', { immediate: true })
        "
        class="px-4"
        color="primary-lighten-3"
        size="small"
        variant="tonal"
      >
        <VIcon class="mr-1" small>mdi-content-copy</VIcon>
        <VIcon dense>mdi-link</VIcon>
      </VBtn>
    </VSheet>
    <div class="meta-elements">
      <MetaInput
        v-for="it in metadata"
        :key="`${activity.uid}.${it.key}`"
        :meta="it"
        @update="updateActivity"
      />
    </div>
    <div>
      <ActivityRelationship
        v-for="relationship in config.relationships"
        :key="`${activity.uid}.${relationship.type}`"
        :activity="activity"
        v-bind="relationship"
      />
    </div>
    <ActivityDiscussion
      :activity="activity"
      class="mt-2 mb-5 mx-1"
      panel
      show-heading
    />
  </div>
</template>

<script lang="ts" setup>
import ActivityDiscussion from '../Discussion/index.vue';
import ActivityRelationship from './ActivityRelationship.vue';
import LabelChip from '@/components/common/LabelChip.vue';
import MetaInput from '@/components/common/MetaInput.vue';
import { useActivityStore } from '@/stores/activity';

const { $schemaService } = useNuxtApp() as any;

const props = defineProps({
  activity: { type: Object, required: true },
});

const route = useRoute();
const store = useActivityStore();
const notify = useNotification();

const activityUrl = computed(() => route.query && window.location.href);
const config = computed(() => $schemaService.getLevel(props.activity.type));
const metadata = computed(() =>
  $schemaService.getActivityMetadata(props.activity),
);

const updateActivity = async (key: string, value: any) => {
  const data = { ...props.activity.data, [key]: value };
  await store.update({ id: props.activity.id, uid: props.activity.uid, data });
  notify(`${config.value.label} saved`, { immediate: true });
};
</script>

<style lang="scss" scoped>
.body {
  position: relative;
  padding: 0.375rem 1rem;
}

.meta-elements {
  padding-top: 0.625rem;
}
</style>
