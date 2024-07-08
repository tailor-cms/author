import Radio from '@/lib/radio';

export default defineNuxtPlugin((nuxtApp) => {
  const radio = Radio.getInstance();
  const defaultChannel = radio.channel('');
  nuxtApp.provide('eventBus', {
    emit: defaultChannel.emit,
    on: defaultChannel.on,
    off: defaultChannel.off,
    channel: (id: string) => radio.channel(id),
  });
});
