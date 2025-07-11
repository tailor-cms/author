<template>
  <!-- eslint-disable-next-line -->
  <div
    ref="activityContentEl"
    class="activity-content"
    @click="onClick"
    @mousedown="mousedownCaptured = true"
  >
    <div class="content-containers-wrapper">
      <ContentLoader v-if="isLoading" class="loader" />
      <PublishDiffProvider
        v-if="repositoryStore.repository && editorStore.selectedActivity"
        v-show="!isLoading"
        v-slot="{
          processedElements,
          processedActivities,
          processedContainerGroups,
        }"
        :activities="repositoryStore.activities"
        :activity-id="editorStore.selectedActivity.id"
        :container-groups="rootContainerGroups"
        :elements="elementsWithComments"
        :publish-timestamp="editorStore.selectedActivity.publishedAt as string"
        :repository-id="repositoryStore.repository.id"
        :show-diff="showPublishDiff"
      >
        <ContentContainers
          v-for="(containerGroup, type) in processedContainerGroups"
          :key="type"
          v-bind="getContainerConfig(type)"
          :container-group="containerGroup"
          :parent-id="editorStore.selectedActivity.id"
          :processed-activities="processedActivities"
          :processed-elements="processedElements"
          @created-container="handleContainerInit"
          @focusout-element="focusoutElement"
        />
      </PublishDiffProvider>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  differenceBy,
  find,
  get,
  isEqual,
  map,
  max,
  throttle,
  transform,
  uniqBy,
  without,
} from 'lodash-es';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { AiContext, AiInput } from '@tailor-cms/interfaces/ai';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { getElementId } from '@tailor-cms/utils';
import pMinDelay from 'p-min-delay';
import type { Repository } from '@tailor-cms/interfaces/repository';

import ContentContainers from './ContainerList.vue';
import ContentLoader from './ContentLoader.vue';
import PublishDiffProvider from './PublishDiffProvider.vue';
import aiAPI from '@/api/ai';
import { useActivityStore } from '@/stores/activity';
import { useAuthStore } from '@/stores/auth';
import { useCommentStore } from '@/stores/comments';
import { useConfigStore } from '@/stores/config';
import { useContentElementStore } from '@/stores/content-elements';
import { useCurrentRepository } from '@/stores/current-repository';
import { useEditorStore } from '@/stores/editor';
import { useUserTracking } from '@/stores/user-tracking';

const CE_FOCUS_EVENT = 'element:focus';
const CE_SELECT_EVENT = 'element:select';
const CE_SELECTION_DELAY = 1000;

const props = defineProps<{
  repository: Repository;
  activity: Activity;
  rootContainerGroups: Record<string, Activity[]>;
  contentContainers: Activity[];
}>();

const emit = defineEmits(['selected']);

const route = useRoute();

const config = useConfigStore();
const { $eventBus, $schemaService } = useNuxtApp() as any;

const repositoryStore = useCurrentRepository();
const authStore = useAuthStore();
const editorStore = useEditorStore();
const activityStore = useActivityStore();
const contentElementStore = useContentElementStore();
const commentStore = useCommentStore();
const storageService = useStorageService();
const userTrackingStore = useUserTracking();

const getOutlineLocationDesciption = (activity: Activity) => {
  const ancestors = activityStore.getAncestors(activity?.id);
  if (!ancestors.length) return '';
  return ancestors.reduce(
    (acc, it) => acc + (acc === '' ? it.data.name : `, ${it.data.name}`),
    '',
  );
};

const getAiConfig = (
  outlineActivityType: string,
  containerType: string,
) => {
  const config = $schemaService
    .getSupportedContainers(outlineActivityType)
    .find((it: any) => it?.type === containerType);
  return config?.ai || {};
};

const doTheMagic = ({
  containerType,
  inputs,
  content,
}: {
  containerType: string;
  inputs: AiInput[];
  content?: string;
}) => {
  const { name, description, schema } = props.repository;
  const context: AiContext = {
    repository: {
      schemaId: schema,
      name,
      description,
      outlineActivityType: props.activity?.type,
      outlineLocation: getOutlineLocationDesciption(props.activity),
      containerType,
      containerConfig: getAiConfig(props.activity.type, containerType),
      topic: props.activity?.data?.name,
    },
    inputs,
    content,
  };
  return aiAPI.generate(context);
};

const editorChannel = $eventBus.channel('editor');
provide('$editorBus', editorChannel);
provide('$eventBus', $eventBus);
provide('$storageService', storageService);
if (config.props.aiUiEnabled) provide('$doTheMagic', doTheMagic);

const isLoading = ref(true);
const focusedElement = ref(null);
const activityContentEl = ref();
const mousedownCaptured = ref<boolean | null>(null);

const showPublishDiff = computed(() => editorStore.showPublishDiff);
const elements = computed(() => contentElementStore.items);
const containerIds = computed(
  () => props.contentContainers?.map((it: any) => it.id) as any[],
);

const elementsWithComments = computed<any>(() => {
  return transform(
    elements.value,
    (elementMap: { [key: string]: any }, element: ContentElement) => {
      const comments = commentStore.where(
        (comment) => comment.contentElement?.uid === element.uid,
      );
      const lastSeen = max([
        (commentStore.$seen.contentElement as any)[element.uid] || 0,
        (commentStore.$seen.activity as any)[props.activity?.uid] || 0,
      ]);
      const hasUnresolvedComments = !!comments.length;
      elementMap[element.uid] = {
        ...element,
        comments,
        hasUnresolvedComments,
        lastSeen: lastSeen || 0,
      };
    },
    {},
  );
});

const containerConfigs = computed(() => {
  if (!props.activity) return [];
  return $schemaService.getSupportedContainers(props.activity.type);
});

const collaboratorSelections = computed(() => {
  if (!props.activity) return [];
  const entityState = userTrackingStore.activityByEntity.activity;
  const activeUserIds = without(
    map(entityState[props.activity.id], 'id'),
    authStore.user?.id,
  );
  if (!activeUserIds.length) return [];
  const selections = userTrackingStore.users
    .filter((it) => activeUserIds.includes(it.id))
    .reduce(
      (acc, { contexts = [], ...user }) => [
        ...acc,
        ...contexts.map((it) => ({ ...user, ...it })),
      ],
      [] as any[],
    )
    .filter((it) => it.elementId && it.activityId === props.activity?.id);
  return uniqBy(selections, (it: any) => `${it.elementId}-${it.id}`);
});

const getContainerConfig = (type: string) => {
  return find(containerConfigs.value, { type });
};

const onClick = (e: any) => {
  if (!mousedownCaptured.value) return;
  mousedownCaptured.value = false;
  if (get(e, 'component.name') !== 'content-element') focusoutElement();
};

const loadContents = async () => {
  if (containerIds.value.length <= 0) {
    return;
  }
  await pMinDelay(
    contentElementStore.fetch(
      repositoryStore.repositoryId as number,
      containerIds.value,
    ),
    600,
  );
  // TODO: Add once collab feature is implemented
  // fetchComments({ activityId }),
  isLoading.value = false;
};

// If container is added upon opening the page
const handleContainerInit = () => {
  if (!isLoading.value) return;
  // Delay to avoid loader glitch; require min loader display time
  setTimeout(() => {
    isLoading.value = false;
  }, 500);
};

// TODO: Used for embedded toolbars, add once table content element is migrated
const initElementChangeWatcher = () => {
  // this.storeUnsubscribe = this.$store.subscribe(mutation => {
  //   const { type, payload: element } = mutation;
  //   if (!focusedElement || !ELEMENT_MUTATIONS.includes(type)) return;
  //   if (element.uid === focusedElement.value?.uid) {
  //     focusedElement.value = { ...focusedElement, ...element };
  //     return;
  //   }
  //   const embed = isQuestion(element.type)
  //     ? find(element.data.question, { id: focusedElement?.id })
  //     : get(element, `data.embeds.${focusedElement?.id}`);
  //   if (!embed) return;
  //   const hasParent = !!focusedElement?.parent;
  //   focusedElement.value = { ...embed, parent: hasParent ? element : null };
  // });
};

const initElementFocusListener = () => {
  const focusHandler = throttle((element, composite) => {
    if (!element) {
      focusedElement.value = null;
      return;
    }
    if (getElementId(focusedElement.value) === getElementId(element)) return;
    focusedElement.value = { ...element, parent: composite };
  }, 50);
  editorChannel.on(CE_FOCUS_EVENT, focusHandler);
};

const focusoutElement = () => {
  editorChannel.emit(CE_FOCUS_EVENT);
};

const selectElement = (
  elementId: string,
  user = authStore.user,
  isSelected = true,
) => {
  editorChannel.emit(CE_SELECT_EVENT, { elementId, isSelected, user });
};

const scrollToElement = (id: string, timeout = 500) => {
  setTimeout(() => {
    const elementId = `#element_${id}`;
    const element = activityContentEl.value.querySelector(elementId);
    if (!element) return;
    element.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, timeout);
};

const revealElement = () => {
  const elementId = route.query.elementId as string;
  if (!elementId) return;
  // Select and scroll to element if elementId is set
  selectElement(elementId);
  scrollToElement(elementId);
};

watch(isLoading, (val) => {
  if (val) return;
  setTimeout(() => {
    revealElement();
    collaboratorSelections.value.forEach(({ elementId, ...user }) =>
      selectElement(elementId, user),
    );
  }, CE_SELECTION_DELAY);
});

watch(() => route.query?.elementId, revealElement);

watch(
  () => focusedElement.value,
  (val) => emit('selected', val),
);

watch(showPublishDiff, (isOn) => {
  if (!isOn) return;
  editorChannel.emit(CE_FOCUS_EVENT);
});

watch(collaboratorSelections, (val, prevVal) => {
  if (isLoading.value || isEqual(val, prevVal)) return;
  const selectionComparator = (it: any) => `${it.elementId}-${it.id}`;
  const removeSelection = differenceBy(prevVal, val, selectionComparator);
  const isSelected = differenceBy(val, prevVal, selectionComparator);
  [
    [removeSelection, false],
    [isSelected, true],
  ].forEach(([items, isSelected]: any) => {
    items.forEach(({ elementId, ...user }: any) =>
      selectElement(elementId, user, isSelected),
    );
  });
});

// TODO: Delay mark seen comments
editorChannel.on('comment', (e: any) => editorStore.processCommentEvent(e));

onBeforeMount(async () => {
  await loadContents();
  initElementFocusListener();
  initElementChangeWatcher();
});

onBeforeUnmount(() => {
  editorChannel.destroy();
});
</script>

<style lang="scss" scoped>
.activity-content {
  min-height: 100%;
  padding: 4rem 2.5rem 0 1.5625rem;
  overflow-y: scroll;
  overflow-y: overlay;
  overflow-x: hidden;

  .content-containers-wrapper {
    max-width: 68.75rem;
    margin: auto;
  }
}

.loader {
  margin-top: 4.375rem;
}
</style>
