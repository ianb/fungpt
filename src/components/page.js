import { useSignal } from "@preact/signals";
import { twMerge } from "tailwind-merge";
import * as icons from "./icons";
import { useEffect, useRef } from "preact/hooks";
import { gpt4Signal, temperatureSignal } from "../gpt";
import { hashParamsSignal, updateHashParams } from "./hash";
import { ErrorBoundary, ErrorCatcher } from "./errorboundary";

export const Page = ({ title, start, children, src, headerButtons }) => {
  useEffect(() => {
    if (start) {
      start();
    }
  }, [start])
  if (!Array.isArray(children)) {
    children = [children];
  }
  const freeChunks = children.filter((child) => child.type === FreeChunk);
  children = children.filter((child) => child.type !== FreeChunk);
  return (
    <div class="flex flex-col h-screen">
      <Header title={title} src={src} buttons={headerButtons} />
      <ErrorCatcher />
      <main class="flex-1 flex overflow-auto bg-gray-300">
        {children.map((child) => {
          if (child.type.isFullTabs) {
            return <ErrorBoundary>{child}</ErrorBoundary>;
          } else {
            return <ErrorBoundary>
              <div class={`w-1/3 bg-gray-100 p-4 overflow-auto m-2 rounded-lg shadow-xl`}>
                {child}
              </div>
            </ErrorBoundary>;
          }
        })}
        {freeChunks}
      </main>
    </div>
  );
};

export const FreeChunk = ({ children }) => {
  return <>{children}</>;
};

export const Header = ({ title, src, buttons }) => {
  return (
    <header class="bg-blue-complement text-white py-1 px-2 height-4 flex justify-between items-center">
      <h1 class="text-lg font-semibold">
        <a href="/">
          <icons.Home class="h-4 w-4 mr-2 inline-block" />
        </a>
        {title}
      </h1>
      <span>
        <label class="mr-4 text-xs">
          temp:
          <select
            class="text-black mx-2 rounded"
            onChange={(e) => {
              if (e.target.value) {
                temperatureSignal.value = parseFloat(e.target.value);
              } else {
                temperatureSignal.value = null;
              }

            }}
            value={temperatureSignal.value === null ? "" : temperatureSignal.value.toFixed(1)}
          >
            <option value="">default</option>
            <option value="0.0">0.0</option>
            <option value="0.2">0.2</option>
            <option value="0.4">0.4</option>
            <option value="0.7">0.7</option>
            <option value="1.0">1.0</option>
            <option value="2.0">2.0</option>
          </select>
        </label>
        <label class="mr-4 text-xs">
          GPT-4?
          <input type="checkbox" class="ml-2" checked={gpt4Signal} onChange={(e) => gpt4Signal.value = e.target.checked} />
        </label>
        {buttons}
        {src && (
          <a href={`https://github.com/ianb/fungpt/blob/main/src/routes/${src}`} target="_blank" class="ml-2" title="View source code">
            <icons.GitHub class="h-4 w-4 inline-block text-white" />
          </a>
        )}
      </span>
    </header>
  );
};

export const Tabs = ({
  children,
  class: className,
  listClass,
  hashParam,
  listChildren,
  defaultSelectedIndex,
}) => {
  if (!Array.isArray(children)) {
    children = [children];
  }
  children = children.flat().filter(x => x);
  const tabs = children.filter((child) => child.type === Tab);
  children = children.filter((child) => child.type !== Tab);
  const selectedIndex = useSignal(defaultSelectedIndex || 0);
  if (hashParam) {
    const i = parseInt(hashParamsSignal.value.get(hashParam), 10);
    if (!Number.isNaN(i)) {
      selectedIndex.value = i;
    }
  }
  function onSelect(index) {
    if (tabs[index].props.disabled) {
      return;
    }
    selectedIndex.value = index;
    if (hashParam) {
      updateHashParams({ [hashParam]: index });
    }
    setTimeout(() => {
      // This is to help textareas get resized when they appear after being hidden
      window.dispatchEvent(new Event("showhide"));
    });
  }
  function isSelected(index) {
    if (selectedIndex.value === -1 || selectedIndex.value >= tabs.length) {
      return index === tabs.length - 1;
    }
    return index === selectedIndex.value;
  }
  return (
    <div class="h-full w-full mb-2">
      <ol class={twMerge("flex flex-wrap items-end w-full sticky top-0 bg-gray-100", listClass)}>
        {tabs.map((tab, index) => {
          let c = "px-2 py-1 rounded-t-lg text-sm font-semibold";
          if (isSelected(index)) {
            c += " bg-aqua-dark text-white";
          } else if (tab.props.disabled) {
            c += " bg-gray-300 text-gray-500";
          } else {
            c += " bg-aqua-light text-gray-500";
          }
          return (
            <li class="mr-1 mt-1" key={index}>
              <button class={c} onClick={() => onSelect(index)} disabled={tab.props.disabled}>
                {tab.props.title}
              </button>
            </li>
          );
        })}
        {listChildren}
      </ol>
      {tabs.map((tab, index) => (
        <div
          data-is-tab
          key={`${index}-${tab.props.title}`}
          class={twMerge(
            "w-full overflow-scroll bg-gray-100 border rounded-b-lg shadow-xl pb-1 px-1",
            isSelected(index) ? "block" : "hidden",
            className,
          )}
        >
          {tab}
        </div>
      ))}
      {children}
    </div>
  );
};
export function isTabVisible(element) {
  let pos = element;
  while (pos) {
    if (pos.hasAttribute("data-is-tab")) {
      return !pos.classList.contains("hidden");
    }
    pos = pos.parentElement;
  }
  console.warn("Attempted to see if tab was visible but no tab found", element);
  return true;
}

export const FullTabs = (props) => {
  return <div class="w-1/3 bg-gray-300 overflow-auto m-2 rounded-b-lg">
    <Tabs class="rounded-r-lg shadow-xl p-2" listClass="bg-gray-300" {...props} />
  </div>
};

FullTabs.isFullTabs = true;

export const FullTabsWrapper = ({ children }) => {
  return <>
    {children}
  </>;
};

export const Tab = ({ title, children }) => {
  return <div>{children}</div>
};

export const Zoomed = ({ children, onClose, class: className }) => {
  const bgEl = useRef();
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
    };
  });
  function handleClick(e) {
    if (e.target === bgEl.current) {
      onClose();
    }
  }
  return <div class="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center z-10" style="background-color: rgba(0, 0, 0, 0.8)" ref={bgEl} onClick={handleClick}>
    <div class={twMerge("h-5/6 w-5/6 m-auto rounded-lg shadow-xl overflow-auto", className)}>
      {children}
    </div>
  </div>;
};
