import { signal, computed } from "@preact/signals";

export const hashSignal = signal(location.hash);
export const hashParamsSignal = computed(() => {
  let hash = hashSignal.value;
  if (hash.startsWith("#")) {
    hash = hash.substring(1);
  }
  return new URLSearchParams(hash);
});

export const updateHashParams = (params) => {
  let hash = location.hash;
  if (hash.startsWith("#")) {
    hash = hash.substring(1);
  }
  const urlParams = new URLSearchParams(hash);
  for (const key in params) {
    if (params[key] === null) {
      urlParams.delete(key);
    } else {
      urlParams.set(key, params[key]);
    }
  }
  location.hash = "#" + urlParams.toString();
};

export function onChange() {
  hashSignal.value = location.hash;
}

window.addEventListener("hashchange", () => {
  hashSignal.value = location.hash;
});

// FIXME: with the Router in app.js and its onChange, this probably
// isn't needed:
window.addEventListener("popstate", () => {
  hashSignal.value = window.location.hash;
});
