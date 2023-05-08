import { signal, effect } from "@preact/signals-core";

export function persistentSignal(name, defaultValue) {
  if (!name || typeof name !== "string") {
    throw new Error("name must be a string");
  }
  let value = localStorage.getItem(`signal.${name}`);
  if (value) {
    value = JSON.parse(value);
  } else {
    value = defaultValue;
  }
  const s = signal(value);
  s.defaultValue = defaultValue;
  effect(() => {
    try {
      localStorage.setItem(`signal.${name}`, JSON.stringify(s.value));
    } catch (e) {
      console.error("Error saving signal", name, s.value, e);
      throw e;
    }
  });
  return s;
}
