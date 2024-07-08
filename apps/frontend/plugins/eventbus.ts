import Radio from '@/lib/radio';

export default defineNuxtPlugin((nuxtApp) => {
  const radio = Radio.getInstance();
  const defaultChannel = radio.channel('');
  const eventBus = {
    emit: defaultChannel.emit,
    on: defaultChannel.on,
    off: defaultChannel.off,
    channel: (id: string) => radio.channel(id),
  };
  nuxtApp.provide('eventBus', eventBus);
  nuxtApp.vueApp.provide('$eventBus', eventBus);
});
