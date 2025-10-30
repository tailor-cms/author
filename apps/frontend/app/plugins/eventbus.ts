import Radio from '@/lib/radio';

export default defineNuxtPlugin(() => {
  const radio = Radio.getInstance();
  const defaultChannel = radio.channel('');
  const provide = {
    eventBus: {
      emit: defaultChannel.emit,
      on: defaultChannel.on,
      off: defaultChannel.off,
      channel: (id: string) => radio.channel(id),
    }
  };
  return { provide };
});
