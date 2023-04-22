import { useState } from "preact/hooks";
import { elementToPreact, markdownToElement } from "../markdown";
import { twMerge } from "tailwind-merge";
import { Button } from "./input";
import { ReturnResult } from "./callback";

export const MarkdownChooser = ({ text, onChoose, multiple, defaultChosen }) => {
  if (!onChoose) {
    if (defaultChosen && defaultChosen.length) {
      console.warn("<MarkdownChooser defaultChosen=...> isn't compatible with getResults()");
    }
    return <ResultMarkdownChooser text={text} multiple={multiple} />;
  }
  const els = markdownToElement(text);
  const result = elementToPreact(els, (element, tag, attrs, children) => {
    if (tag === "li") {
      return <Choosable onChoose={onChoose} defaultChosen={defaultChosen} text={element.innerText.trim()} attrs={attrs}>{children}</Choosable>;
    }
    return null;
  });
  return <div class="unreset">{result}</div>;
}

const ResultMarkdownChooser = ({ text, multiple }) => {
  multiple = !!multiple;
  const els = markdownToElement(text);
  const [chosen, setChosen] = useState([]);
  return <ReturnResult.Consumer>
    {(onDone) => {
      function onChoose(event, text) {
        if (multiple) {
          if (chosen.includes(text)) {
            setChosen(chosen.filter((t) => t !== text));
          } else {
            setChosen([...chosen, text]);
          }
        } else {
          onDone(text);
        }
      }
      const result = elementToPreact(els, (element, tag, attrs, children) => {
        if (tag === "li") {
          return <Choosable onChoose={onChoose} defaultChosen={chosen} text={element.innerText.trim()} attrs={attrs}>{children}</Choosable>;
        }
        return null;
      });
      return <>
        {multiple &&
          <div><Button onClick={() => onDone(chosen)}>Done</Button></div>}
        <div class="unreset">
          {result}
        </div>
      </>;
    }}

  </ReturnResult.Consumer>;
};

const Choosable = ({ children, defaultChosen, text, onChoose, attrs }) => {
  let startChosen = false;
  if (defaultChosen && defaultChosen.value) {
    defaultChosen = defaultChosen.value;
  }
  const chosen = defaultChosen && defaultChosen.includes(text);
  function onClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const result = onChoose(event, text);
    if (result === true || result === false) {
      setChosen(result);
    }
  }
  return <li
    class={twMerge("cursor-pointer hover:outline-dashed", chosen ? "bg-gray-600 hover:bg-gray-700 text-white" : "hover:bg-gray-300 ")}
    onClick={onClick} {...attrs}>
    {children}
  </li>;
};
