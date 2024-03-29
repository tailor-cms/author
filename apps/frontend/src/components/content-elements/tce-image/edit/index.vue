<template>
  <div class="tce-image">
    <element-placeholder
      v-if="showPlaceholder"
      :is-focused="isFocused"
      :is-disabled="isDisabled"
      :dense="dense"
      name="Image component"
      icon="mdi-image-plus"
      active-placeholder="Use toolbar to upload the image"
      active-icon="mdi-arrow-up" />
    <div v-else :class="{ 'hide-cropper': !showCropper }" class="image-wrapper">
      <cropper
        v-show="showCropper"
        ref="cropper"
        :view-mode="2"
        :auto-crop-area="0.5"
        :auto-crop="false"
        :guides="true"
        :ready="onReady"
        :responsive="true"
        :rotatable="false"
        :background="false"
        :zoomable="false"
        :scalable="false"
        :movable="false"
        :modal="false"
        :src="currentImage"
        drag-mode="none" />
      <v-img
        v-show="!showCropper"
        :src="currentImage"
        :aspect-ratio="aspectRatio"
        :max-width="elementWidth"
        class="mx-auto">
        <template #placeholder>
          <v-row
            align="center"
            justify="center"
            class="fill-height ma-0">
            <v-icon size="50" color="grey lighten-1" class="image-icon">
              mdi-image-outline
            </v-icon>
            <v-progress-circular size="80" color="grey lighten-1" indeterminate />
          </v-row>
        </template>
      </v-img>
    </div>
  </div>
</template>

<script>
import Cropper from './Cropper.vue';
import { ElementPlaceholder } from '@tailor-cms/core-components';
import { imgSrcToDataURL } from 'blob-util';
import isEmpty from 'lodash/isEmpty';

function toDataUrl(imageUrl) {
  if (!imageUrl) return Promise.resolve(imageUrl);
  return imgSrcToDataURL(imageUrl, 'image/png', 'Anonymous');
}

function getImageDimensions(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = event => {
      const err = new Error(`Failed to load image: ${url}`);
      err.cause = event;
      reject(err);
    };
    img.src = url;
  });
}

export default {
  name: 'tce-image',
  inject: ['$elementBus'],
  props: {
    element: { type: Object, required: true },
    isFocused: { type: Boolean, default: false },
    isDisabled: { type: Boolean, default: false },
    dense: { type: Boolean, default: false }
  },
  data: () => ({ currentImage: null, persistedImage: null, showCropper: false }),
  computed: {
    showPlaceholder() {
      const imageAvailable = !isEmpty(this.element.data.url);
      if (imageAvailable) return false;
      if (this.$refs.cropper) this.$refs.cropper.destroy();
      return true;
    },
    elementWidth: ({ element }) => element.data.meta?.width,
    elementHeight: ({ element }) => element.data.meta?.height,
    aspectRatio: ({ elementHeight, elementWidth }) =>
      elementHeight && elementWidth && (elementWidth / elementHeight)
  },
  methods: {
    onReady() {
      if (!this.showCropper || !this.$refs.cropper) return;
      this.$refs.cropper.show();
    },
    load(imageUrl) {
      this.currentImage = imageUrl;
      this.persistedImage = imageUrl;
      if (imageUrl && this.$refs.cropper) this.$refs.cropper.replace(imageUrl);
    },
    async save(image) {
      const meta = await getImageDimensions(image);
      this.$emit('save', { ...this.element.data, url: image, meta });
    }
  },
  watch: {
    isFocused(focused) {
      if (focused) return;
      if (this.persistedImage !== this.currentImage) this.save(this.currentImage);
      if (this.currentImage) this.$refs.cropper.clear();
    },
    'element.data.url'(imageUrl) {
      toDataUrl(imageUrl).then(dataUrl => this.load(dataUrl));
    }
  },
  mounted() {
    this.load(this.element.data.url);

    this.$elementBus.on('upload', dataUrl => {
      if (this.currentImage) this.$refs.cropper.replace(dataUrl);
      this.currentImage = dataUrl;
      this.persistedImage = dataUrl;
      this.save(dataUrl);
    });

    this.$elementBus.on('showCropper', () => {
      this.showCropper = true;
      this.$refs.cropper.show();
    });

    this.$elementBus.on('hideCropper', () => {
      this.showCropper = false;
      this.$refs.cropper.clear();
    });

    this.$elementBus.on('crop', () => {
      this.currentImage = this.$refs.cropper.getCroppedCanvas().toDataURL();
      this.$refs.cropper.replace(this.currentImage);
    });

    this.$elementBus.on('undo', () => {
      this.currentImage = this.persistedImage;
      this.$refs.cropper.replace(this.persistedImage);
    });
  },
  beforeDestroy() {
    if (this.$refs.cropper) this.$refs.cropper.destroy();
  },
  components: { Cropper, ElementPlaceholder }
};
</script>

<style lang="scss" scoped>
.hide-cropper ::v-deep .cropper-container {
  display: none;
}

.image-icon {
  position: absolute;
}
</style>
