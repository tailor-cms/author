<template>
  <v-snackbar v-model="snackbar" v-bind="context" multi-line>
    {{ context.message }}
    <template #action>
      <v-btn
        @click="close"
        color="secondary lighten-2"
        text>
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script>
const initialData = () => ({
  message: '',
  color: 'primary darken-4',
  timeout: 2500,
  right: true
});

export default {
  name: 't-snackbar',
  data: () => ({
    showRequest: null,
    snackbar: false,
    context: initialData()
  }),
  methods: {
    show(message, options) {
      this.showRequest = new Deferred();
      Object.assign(this.context, { message, ...options });
      this.snackbar = true;
      return this.showRequest.promise;
    },
    close() {
      this.snackbar = false;
    }
  },
  watch: {
    snackbar(visible) {
      if (visible) return;
      this.context = initialData();
      this.showRequest && this.showRequest.resolve();
    }
  }
};

function Deferred() {
  this.promise = new Promise(resolve => (this.resolve = resolve));
}
</script>
