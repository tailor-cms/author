// event emitter with channel support
import type { Emitter, EventHandlerMap, EventType, Handler } from 'mitt';
import mitt from 'mitt';

const isFunction = (arg: any) => typeof arg === 'function';
const last = (arr: any[]) => arr[arr.length - 1];
const noop = () => {};
const requestEvent = (id: string) => `request->${id}`;
const replyEvent = (id: string) => `reply->${id}`;

type Events = Emitter<Record<EventType, unknown>>;

interface ExtendedMitt extends Events {
  once<Key extends keyof Events>(
    type: Key,
    handler: Handler<Events[Key]>,
  ): void;
}

export function extendedMitt<Events extends Record<EventType, unknown>>(
  all?: EventHandlerMap<Events>,
) {
  const instance = mitt(all);
  // @ts-ignore
  instance.once = (type: any, fn: any) => {
    instance.on(type, fn);
    instance.on(type, instance.off.bind(instance, type, fn));
  };
  return instance as unknown as ExtendedMitt;
}

class Channel {
  private id: string;
  private bus: ExtendedMitt;
  private repliers: Map<unknown, unknown>;

  constructor(bus: ExtendedMitt, id: string) {
    this.id = id;
    this.bus = bus;
    this.repliers = new Map();
  }

  emit = (eventName: string, data: unknown) =>
    this.bus.emit(this.resolveEventName(eventName), data);

  on = (eventName: string, fn: any) =>
    this.bus.on(this.resolveEventName(eventName), fn);

  off = (eventName: string, fn: any) =>
    this.bus.off(this.resolveEventName(eventName), fn);

  once = (eventName: string, fn: any) =>
    this.bus.once(this.resolveEventName(eventName) as keyof Events, fn);

  request(id: string, ...args: any[]) {
    const onReply = isFunction(last(args)) ? args.pop() : noop;
    this.once(replyEvent(id), onReply);
    this.emit(requestEvent(id), args);
  }

  reply(id: string, listener: any) {
    const callback = (...args: any[]) => this.emit(replyEvent(id), args);
    const onRequest = (...args: any[]) => listener(...args, callback);
    this.repliers.set(listener, onRequest);
    this.on(requestEvent(id), onRequest);
  }

  // Prefix event name with channel id
  resolveEventName = (eventName: string) =>
    this.id ? [this.id, eventName].join('/') : eventName;
}

export default class Radio {
  // eslint-disable-next-line no-use-before-define
  private static instance: Radio;
  private static channels = new Map();
  private static bus = extendedMitt();

  channel(id: string) {
    const { bus, channels } = Radio;
    if (channels.has(id)) return channels.get(id);
    const channel = new Channel(bus, id);
    channels.set(id, channel);
    return channel;
  }

  static getInstance() {
    if (!Radio.instance) Radio.instance = new Radio();
    return Radio.instance;
  }
}
