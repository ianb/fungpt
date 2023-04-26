import { Page, FreeChunk } from "../../components/page";
import { useEffect, useState } from "preact/hooks";
import { Markdown } from "../../markdown";
import { hashParamsSignal, updateHashParams } from "../../components/hash";

const Presentation = () => {
  const [source, setSource] = useState("");
  useEffect(() => {
    fetch("/assets/presentation.md").then(async (res) => await res.text()).then(setSource);
  }, []);
  return <Page title="Fun with GPT" src="../assets/presentation.md">
    <FreeChunk>
      <div class="bg-white m-2 p-8 rounded shadow-xl w-full text-xl">
        {!source ? <div>Loading...</div> : <MarkdownSlides text={source} />}
      </div>
    </FreeChunk>
  </Page>;
};

export default Presentation;

const MarkdownSlides = ({ text }) => {
  let parts = text.split(/^##\s/gm);
  parts = parts.filter(x => x.trim());
  parts = parts.map((part) => "## " + part);
  let index = parseInt(hashParamsSignal.value.get("slide") || 0, 10);
  index = (index + parts.length) % parts.length;
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") {
        updateHashParams({ slide: (index + 1) % parts.length });
      } else if (e.key === "ArrowLeft") {
        updateHashParams({ slide: (index - 1 + parts.length) % parts.length });
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [index]);
  return <>
    <div class="float-right text-sm text-gray-500">{index + 1} / {parts.length}</div>
    <Markdown text={parts[index]} />
  </>;
};
