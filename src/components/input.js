import { twMerge } from "tailwind-merge";
import { useRef, useEffect, useState } from "preact/hooks";
import { ReturnResult } from "./callback";

export const TextInput = ({ label, signal, class: className, ...props }) => {
  const inputRef = useRef();
  className = twMerge("shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight", className);
  useEffect(() => {
    if (props.autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef.current])
  if (signal) {
    return <Label label={label}>
      <input
        class={className}
        ref={inputRef}
        type="text"
        value={signal}
        onInput={(event) => signal.value = event.target.value}
        {...props} />
    </Label>;
  }
  const onSubmit = (onDone, e) => {
    e.preventDefault();
    const value = inputRef.current.value;
    inputRef.current.value = "";
    onDone(value);
  };
  return <ReturnResult.Consumer>
    {(onDone) => (
      <Label label={label}>
        <form onSubmit={onSubmit.bind(null, onDone)}>
          <input
            class={className}
            ref={inputRef}
            type="text" {...props} />
        </form>
      </Label>
    )}
  </ReturnResult.Consumer>;
};

export const SimpleTextInput = ({ class: className, ...props }) => {
  if (!props.ref) {
    props.ref = useRef();
  }
  useEffect(() => {
    if (!props.onSubmit || !props.ref.current) {
      return;
    }
    function onKeyDown(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        props.onSubmit(event);
      }
    }
    props.ref.current.addEventListener("keydown", onKeyDown);
    return () => {
      props.ref.current.removeEventListener("keydown", onKeyDown);
    };
  }, [props.onSubmit, props.ref.current]);
  className = twMerge("shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight", className);
  return <input class={className} type="text" {...props} />;
};

export const Label = ({ label, class: className, children }) => {
  return <label>
    <div class={twMerge("block text-gray-700 text-sm font-bold mb-1 mt-2", className)}>{label}</div>
    {children}
  </label>;
};

export const TextArea = ({ label, signal, class: className, ...props }) => {
  if (signal) {
    return <Label label={label}>
      <ExpandableTextArea
        class={className}
        value={signal}
        onInput={(event) => signal.value = event.target.value}
        {...props} />
    </Label>;
  }
  return <ReturnResult.Consumer>
    {(onDone) => {
      function onShiftEnter(event) {
        event.preventDefault();
        const value = event.target.value;
        event.target.value = "";
        onDone(value);
      }
      return <Label label={label}>
        <ExpandableTextArea
          class={className}
          onShiftEnter={onShiftEnter}
          {...props} />
        <div class="text-xs float-right text-gray-600">Shift+Enter to submit</div>
      </Label>;
    }}
  </ReturnResult.Consumer>;
}

export const ExpandableTextArea = ({ class: className, ...props }) => {
  const textRef = useRef();
  const noAutoShrink = props.noAutoShrink;
  delete props.noAutoShrink;
  function onKeyDown(event) {
    if (props.onShiftEnter && event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      props.onShiftEnter(event);
      return false;
    }
    setTimeout(() => {
      fixHeight(event.target);
    });
    return undefined;
  }
  function onShowHide(event) {
    setTimeout(() => {
      if (textRef.current) {
        fixHeight(textRef.current);
      }
    });
  }
  const prevOnInput = props.onInput;
  delete props.onInput;
  function onInput(event) {
    setTimeout(() => {
      fixHeight(event.target);
    });
    if (prevOnInput) {
      prevOnInput(event);
    }
  }
  function fixHeight(el) {
    const prevLength = el.getAttribute("data-prev-length");
    const prevHeight = parseInt(el.getAttribute("data-prev-height"), 10);
    if (!prevLength || parseInt(prevLength, 10) > el.value.length) {
      if (!noAutoShrink) {
        el.style.height = "0";
      }
    }
    if (!isNaN(prevHeight) && el.scrollHeight <= prevHeight + 3 && el.scrollHeight >= prevHeight - 3) {
      return;
    }
    const newHeight = el.scrollHeight + 5;
    el.style.height = `${newHeight}px`;
    el.setAttribute("data-prev-length", el.value.length);
    el.setAttribute("data-prev-height", newHeight);
  }
  useEffect(() => {
    if (textRef.current) {
      fixHeight(textRef.current);
    }
    window.addEventListener("showhide", onShowHide);
    return () => {
      window.removeEventListener("showhide", onShowHide);
    };
  }, [textRef.current, onShowHide]);
  const autoFocus = props.autoFocus;
  delete props.autoFocus;
  useEffect(() => {
    if (autoFocus && textRef.current) {
      textRef.current.focus();
      const len = textRef.current.value.length;
      textRef.current.setSelectionRange(len, len);
    }
  }, []);
  return (
    <textarea
      class={twMerge("w-full border rounded p-3", className)}
      ref={textRef}
      onKeyDown={onKeyDown}
      onInput={onInput}
      {...props}
    />
  );
};

export const Button = ({ returns, onClick, children, class: className, ...props }) => {
  if (!returns && onClick) {
    return <button
      class={twMerge("bg-magenta hover:bg-blue-700 text-white py-1 px-2 rounded-lg m-1", className)}
      onClick={onClick} {...props}>
      {children}
    </button>;
  }
  return <ReturnResult.Consumer>
    {(onDone) => (
      <button
        class={twMerge("bg-magenta hover:bg-blue-700 text-white py-1 px-2 rounded-lg m-1", className)}
        onClick={onDone.bind(null, returns)} {...props}>
        {children}
      </button>
    )}
  </ReturnResult.Consumer>;
};

export const A = ({ children, class: className, ...props }) => {
  return (
    <a class={twMerge("text-blue-500 underline hover:text-blue-700", className)} {...props}>
      {children}
    </a>
  );
};

export const H1 = ({ children, class: className, ...props }) => {
  return (
    <h1 class={twMerge("text-md font-bold flex justify-center", className)} {...props}>
      {children}
    </h1>
  );
};

export const ChooseOne = ({ children }) => {
  return <ReturnResult.Consumer>
    {(onDone) => (
      <div>
        {children.map((child, i) => (
          <div class="hover:bg-gray-300 cursor-pointer" key={i} onClick={() => {
            onDone(child.props.returns || child);
          }}>
            {child}
          </div>
        ))}
      </div>
    )}
  </ReturnResult.Consumer>;
};

export const ChooseMany = ({ children }) => {
  const [selected, setSelected] = useState([]);
  return <ReturnResult.Consumer>
    {(onDone) => {
      function onClick(child) {
        if (selected.includes(child)) {
          setSelected(selected.filter((c) => c !== child));
        } else {
          setSelected([...selected, child]);
        }
      }
      function onDoneClick() {
        if (selected.length) {
          onDone(selected.map((x) => x.props.returns || x));
        }
      }
      return <ul>
        {children.map((child, i) => (
          <li
            role="button"
            class={selected.includes(child) ? "hover:bg-gray-500 cursor-pointer bg-gray-400" : "hover:bg-gray-300 cursor-pointer"}
            key={i}
            onClick={() => onClick(child)}
          >
            {child}
          </li>
        ))}
        {selected.length ?
          <li><Button onClick={onDoneClick}>Done</Button></li>
          : <li><Button onClick={() => { }} disabled="1">Done</Button></li>}
      </ul>;
    }}
  </ReturnResult.Consumer>;
};
