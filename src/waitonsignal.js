import { effect } from "@preact/signals";

export function waitOnSignal(signal, condition = (v) => !!v) {
  return new Promise((resolve) => {
    if (condition(signal.value)) {
      resolve(signal.value);
    }
    const canceller = effect(() => {
      if (condition(signal.value)) {
        canceller();
        resolve(signal.value);
      }
    });
  });
}
