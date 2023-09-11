import { createContext } from "preact";
import { effect } from "@preact/signals";

export const ReturnResult = createContext((value) => { throw new Error("No provider") });

export function getResult(
  containerSignal,
  component,
  { eventReceivers } = {}
) {
  return new Promise((resolve, reject) => {
    function onDone(value) {
      containerSignal.value = <div class="relative">
        <div class="absolute inset-0 bg-white opacity-50 z-10"></div>
        {component}
      </div>;
      resolve(value);
    }
    if (eventReceivers) {
      if (!Array.isArray(eventReceivers)) {
        eventReceivers = [eventReceivers];
      }
      for (const receiver of eventReceivers) {
        receiver.onDone = onDone;
      }
    }
    containerSignal.value = <ReturnResult.Provider value={onDone}>
      {component}
    </ReturnResult.Provider>;
  });
}

export class EventReceiver {
  constructor() {
    this.onDone = null;
  }
}

export async function fillSignal({ container, signal, request, mutator }) {
  if (signal.value) {
    return signal.value;
  }
  let value = await getResult(container, request());
  if (mutator) {
    value = await mutator(value);
  }
  signal.value = value;
  return signal.value;
}

export async function watchSignals(signalMap) {
  return new Promise((resolve) => {
    let callCount = 0;
    const destroyer = effect(() => {
      if (callCount) {
        // It's been called once
        // FIXME: this should indicate what changed
        // Maybe with {signalName: {oldValue, newValue}}
        destroyer();
        resolve();
        return;
      }
      for (const [name, signal] of Object.entries(signalMap)) {
        let _ = signal.value;
      }
      callCount++;
    });
  });
}
