import { createContext } from "preact";

export const ReturnResult = createContext((value) => { throw new Error("No provider") });

export function getResult(containerSignal, component) {
  return new Promise((resolve, reject) => {
    function onDone(value) {
      containerSignal.value = <div class="relative">
        <div class="absolute inset-0 bg-white opacity-50 z-10"></div>
        {component}
      </div>;
      // containerSignal.value = null;
      resolve(value);
    }
    containerSignal.value = <ReturnResult.Provider value={onDone}>
      {component}
    </ReturnResult.Provider>;
  });
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
