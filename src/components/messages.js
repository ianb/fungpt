import { useRef, useEffect } from "preact/hooks";
import { H1 } from "./input";
import { Markdown } from "../markdown";

export const Messages = ({ messages }) => {
  const lastMessageRef = useRef();
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView();
    }
  }, [lastMessageRef.current])
  const list = messages.value.filter((message) => message.role !== "system");
  if (!list.length) {
    return <>
      <H1>Messages</H1>
      <div class="p-4">No messages</div>
    </>;
  }
  const userClass = "bg-blue-500 text-white px-4 py-2 rounded-lg mb-2 mr-10 shadow-xl";
  const otherClass = "bg-gray-300 px-4 py-2 rounded-lg ml-10 mb-2 shadow-xl";
  let userRole = "user";
  if (!list.find((message) => message.role === "user")) {
    userRole = list[0].role;
  }
  return <div>
    <H1>Messages</H1>
    {list.map((message, i) => {
      return <div ref={i === list.length - 1 ? lastMessageRef : null} class={message.role === userRole ? userClass : otherClass}>
        <Markdown text={message.content || "..."} />
        {message.annotations && <MessageAnnotation annotations={message.annotations} />}
      </div>
    })}
  </div>;
};

const MessageAnnotation = ({ annotations }) => {
  if (!Array.isArray(annotations)) {
    annotations = [annotations];
  }
  return <div>
    {annotations.map((annotation) => {
      if (typeof annotation === "string") {
        annotation = { content: annotation };
      }
      return <div class="text-sm text-gray-500">
        {annotations.tag ? <div class="font-semibold">{annotation.tag}</div> : null}
        <Markdown text={annotation.content} />
      </div>
    })}
  </div>;
};
