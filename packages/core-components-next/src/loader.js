import pMinDelay from 'p-min-delay';

export default function loader(action, name, minDuration = 0) {
  return function () {
    [name].value = true;
    return pMinDelay(
      Promise.resolve(action.call(this, ...arguments)),
      minDuration,
    ).finally(() => ([name].value = false));
  };
}
