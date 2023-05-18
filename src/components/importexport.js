import * as icons from "./icons.js";
import { SimpleTextInput } from "./input.js";
import { Popup } from "./popup.js";

export function ImportExport({ title, appId, signals }) {
  function onExport(event) {
    const jsonData = {};
    for (const key in signals) {
      jsonData[key] = signals[key].value;
    }
    const stringData = JSON.stringify(jsonData, null, "  ");
    const blob = new Blob([stringData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    event.target.href = url;
  }
  function onFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target.result;
      const jsonData = JSON.parse(fileContent);
      for (const key in signals) {
        if (key in jsonData) {
          signals[key].value = jsonData[key];
        }
      }
    };
    reader.readAsText(file);
  }
  function onLoadKey(key) {
    const jsonData = JSON.parse(localStorage.getItem(appId + "." + key));
    for (const key in signals) {
      if (key in jsonData) {
        signals[key].value = jsonData[key];
      }
    }
  }
  function onSaveKey(key) {
    const jsonData = {};
    for (const key in signals) {
      jsonData[key] = signals[key].value;
    }
    const stringData = JSON.stringify(jsonData, null, "  ");
    localStorage.setItem(appId + "." + key, stringData);
  }
  return <div>
    <div class="mb-4">
      <a
        class="bg-magenta hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
        href="#"
        onClick={onExport}
        download={title}
      >
        Export/download
        <icons.Download class="h-4 w-4 inline-block ml-1" />
      </a>
    </div>
    <div>
      <input type="file" onChange={onFileUpload} />
    </div>
    {appId ? <>
      <SimpleTextInput
        class="mt-2"
        onSubmit={(event) => {
          onSaveKey(event.target.value);
          event.target.value = "";
        }}
        placeholder="Save as..." />
      <SimpleTextInput
        class="mt-2"
        onSubmit={(event) => {
          onLoadKey(event.target.value);
          event.target.value = "";
        }}
        placeholder="Load from..." />
      <ol class="mt-2 list-decimal pl-4">
        {localStorageKeys(appId + ".")
          .map(key => key.slice(appId.length + 1))
          .filter(key => !key.startsWith("_"))
          .map((key) => (
            <li class="hover:bg-gray-200 text-black cursor-pointer" onClick={() => onLoadKey(key)}>
              {key}
            </li>
          ))}
      </ol>
    </> : null}
  </div>
}

export function ImportExportPopup({ title, appId, signals }) {
  return <Popup button={<icons.Download class="h-4 w-4 mx-2 inline-block ml-1" />}>
    <ImportExport title={title} appId={appId} signals={signals} />
  </Popup>
}

function localStorageKeys(prefix) {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(prefix)) {
      keys.push(key);
    }
  }
  return keys;
}
