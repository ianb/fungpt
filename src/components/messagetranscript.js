import { useRef, useEffect } from "preact/hooks";
import { H1 } from "./input";
import { Markdown } from "../markdown";

export const MessageTranscript = ({ messages, userName, assistantName }) => {
  const lastMessageRef = useRef();
  if (messages.value) {
    messages = messages.value;
  }
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView();
    }
  }, [lastMessageRef.current])
  if (!messages.length) {
    return <>
      <H1>Messages</H1>
      <div class="p-4">No messages</div>
    </>;
  }
  const children = [];
  for (const message of messages) {
    let role = message.role;
    let name;
    if (role === "user") {
      name = userName;
    } else if (role === userName) {
      role = "user";
      name = userName;
    } else if (role === "assistant") {
      name = assistantName;
    } else if (role === assistantName) {
      role = "assistant";
      name = assistantName;
    } else {
      console.warn("Unexpected role", role, "in message", message);
      name = role;
      role = "assistant";
    }
    const isLastMessage = message === messages[messages.length - 1];
    for (const action of message.actions) {
      const isLastAction = isLastMessage && action === message.actions[message.actions.length - 1];
      const props = { role, userName, assistantName };
      if (isLastAction) {
        props.elementRef = lastMessageRef;
      }
      if (action.name || action.character || action.perspective) {
        name = action.name || action.character || action.perspective;
      }
      if (action.type === "description") {
        children.push(<Description content={action.content} {...props} />);
      } else if (action.type.startsWith("thought") || action.type.startsWith("decision")) {
        children.push(<Thought type={action.type} name={name} content={action.content} {...props} />);
      } else if (action.type === "dialog") {
        children.push(<Dialog name={name} content={action.content} {...props} />);
      } else {
        console.warn("Unexpected action", action, "in message", message);
        children.push(<Description content={`Type: ${action.type}\n\n${action.content}`} {...props} />)
      }
    }
  }
  return <div>
    <H1>Messages</H1>
    {children}
  </div>;
};

const Description = ({ elementRef, role, userName, assistantName, content }) => {
  return <div ref={elementRef} class="bg-white text-sm px-4 py-2 rounded-sm mx-6 mb-2 shadow-xl">
    <Markdown text={content} />
  </div>;
};

const Thought = ({ elementRef, role, userName, assistantName, type, name, content }) => {
  return <div ref={elementRef} class="bg-gray-300 font-serif text-sm px-4 py-2 rounded-l-lg ml-16 mb-2 shadow-xl italic bg-gradient-to-r from-gray-400 to-gray-100">
    {name !== assistantName ? <div class="font-semibold">{name}</div> : null}
    <Markdown text={content} />
  </div>;
};

const Dialog = ({ elementRef, role, userName, assistantName, name, content }) => {
  let className;
  if (role === "user") {
    className = "bg-blue-500 text-white px-4 py-2 rounded-lg mb-2 mr-10 shadow-xl";
  } else if (name === userName) {
    className = "bg-blue-300 text-white px-4 py-2 rounded-lg mb-2 mr-10 shadow-xl"
  } else {
    className = "bg-purple-200 px-4 py-2 rounded-lg ml-10 mb-2 shadow-xl";
  }
  return <div ref={elementRef} class={className}>
    {name !== assistantName && name !== userName ? <div class="font-semibold">{name}</div> : null}
    <Markdown text={content} />
  </div>;
};
