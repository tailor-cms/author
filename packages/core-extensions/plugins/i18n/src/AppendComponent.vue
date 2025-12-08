<template>
  <VMenu
    v-if="i18n.isEnabled && isTranslatable"
    v-model="isVisible"
    location="bottom end"
    :close-on-content-click="false"
  >
    <template #activator="{ props: tooltipProps }">
      <VChip
        v-bind="tooltipProps"
        :color="badgeColor"
        class="ml-2 i18n-badge"
        size="x-small"
        variant="tonal"
      >
        <VIcon size="14" start>mdi-translate</VIcon>
        {{ translatedCount }}/{{ totalLanguages }}
        <span v-if="displayedLang?.isFallback" class="ml-1 fallback-indicator">
          ({{ displayedLang.code.toUpperCase() }})
        </span>
      </VChip>
    </template>
    <VCard min-width="300">
      <div class="px-4 pt-3">
        <div class="text-caption text-medium-emphasis mb-2">Translations</div>
        <VBtnToggle
          v-model="activeLanguage"
          mandatory
          density="compact"
          variant="outlined"
          divided
          class="mb-3"
        >
          <VBtn
            v-for="lang in i18n.availableLanguages"
            :key="lang.code"
            :value="lang.code"
            size="small"
          >
            {{ lang.name }}
            <VIcon
              v-if="translationStatus[lang.code]"
              icon="mdi-check-circle"
              color="success"
              size="14"
              class="ml-1"
            />
            <VIcon
              v-else
              icon="mdi-circle-outline"
              size="14"
              class="ml-1 text-medium-emphasis"
            />
          </VBtn>
        </VBtnToggle>
      </div>
      <div class="px-4 pb-4">
        <component
          :is="componentName"
          :key="activeLanguage"
          :meta="getMetaWithValue(activeLanguage)"
          :dark="dark"
          :error-messages="errorMessage"
          :class="{ required: meta.validate?.required }"
          @update="update"
        />
      </div>
    </VCard>
  </VMenu>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useField } from 'vee-validate';

interface Props {
  meta: {
    key: string;
    type: string;
    validate?: {
      required?: boolean;
      [key: string]: any;
    };
    [key: string]: any;
  };
  data: Record<string, any>;
  componentName: string;
  dark?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['update']);

const { $i18n: i18n, $metaRegistry, $pluginRegistry } = useNuxtApp() as any;

const isVisible = ref(false);

const isTranslatable = computed(() => {
  const metaType = $metaRegistry.get(props.meta.type?.toUpperCase());
  return metaType?.i18n === true;
});

const translationStatus = computed(() =>
  i18n.getTranslationStatus(props.data, props.meta.key),
);

const translatedCount = computed(() =>
  Object.values(translationStatus.value).filter(Boolean).length,
);

const totalLanguages = computed(() => i18n.availableLanguages.length);

// Detect which language is being displayed (fallback detection)
const displayedLang = computed(() =>
  i18n.getDisplayedLanguage(props.data, props.meta.key),
);

const badgeColor = computed(() => {
  const ratio = translatedCount.value / totalLanguages.value;
  if (ratio === 1) return props.dark ? 'teal-lighten-3' : 'teal';
  if (ratio === 0) return props.dark ? 'orange-lighten-2' : 'orange-darken-3';
  return props.dark ? 'secondary-lighten-3' : 'secondary';
});

const activeLanguage = ref(i18n.currentLanguage);

const { errorMessage, handleChange, validate, resetField } = useField(
  () => `${props.meta.key}_i18n`,
  props.meta.validate || {},
  { label: props.meta.key },
);

const getMetaWithValue = (lang: string) => {
  const { data, meta } = props;
  const context = { data, key: meta.key, lang };
  const value = $pluginRegistry.filter('data:value', data?.[meta.key], context);
  return { ...meta, value };
};

const update = async (key: string, value: any) => {
  handleChange(value, false);
  const { valid } = await validate();
  if (!valid) return;
  const context = { key, value, lang: activeLanguage.value };
  const data = $pluginRegistry.transform('data:update', props.data, context);
  emit('update', key, value, data);
};

watch(activeLanguage, () => resetField());
watch(isVisible, (val) => val && resetField());
</script>

<style scoped>
.fallback-indicator {
  font-size: 0.65rem;
  opacity: 0.8;
}
</style>
