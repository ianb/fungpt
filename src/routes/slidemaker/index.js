import { GPT } from "../../gpt";
import { tmpl } from "../../template";
import { getResult } from "../../components/callback";
import { signal, computed } from "@preact/signals";
import { TextArea, Button } from "../../components/input";
import { Page, Tabs, Tab } from "../../components/page";
import { useEffect } from "preact/hooks";
import { Messages } from "../../components/messages";
import { persistentSignal } from "../../persistentsignal";
import { hashParamsSignal, updateHashParams } from "../../components/hash";
import { Markdown } from "../../markdown";
import { MarkdownChooser } from "../../components/markdownchooser";

const gpt = new GPT();
const slides = persistentSignal("slidemaker.slides", "");
const instructions = persistentSignal("slidemaker.instructions", "");
const nextSlideOptions = persistentSignal("slidemaker.nextSlideOptions", "");
const slidesSplit = computed(() => {
  const parts = slides.value.split(/^##\ /gm);
  return parts.map((part) => "## " + part.trim());
});
const Input = signal();

const SlideMaker = ({ }) => {
  return <Page title="Slide Assist" start={slideAssist}>
    <Slides />
    <Tabs>
      <Tab title="Assist">
        <div>
          {Input.value || <div>Loading...</div>}
        </div>
        <div>
          <TextArea label="Instructions:" signal={instructions} />
        </div>
      </Tab>
      <Tab title="Edit">
        <TextArea label="Slides:" signal={slides} />
      </Tab>
    </Tabs>
    <gpt.Log />
  </Page>;
};

export default SlideMaker;

async function slideAssist() {
  while (true) {
    let command = await getResult(Input, <div>
      <Button returns={{ action: "generateNext" }}>Generate Next</Button>
    </div>);
    if (command.action === "generateNext") {
      if (!nextSlideOptions.value) {
        const response = await gpt.chat({
          messages: [
            {
              role: "system", content: tmpl`
              You are a slide assistant. You help people make slides. You like snappy, fun slides with subtle jokes, all while being informative.
            `
            },
            {
              role: "user", content: tmpl`
              ${instructions.value}

              I'm making slides for a presentation. Each "## Heading" is a new slide.

              Create a numbered list of ideas for the next slide in the presentation. Make the list at least 5 long. List them like:

              1. Everything old is new!: describing how the old ideas of the past have new life
              2. [Slide Title]: [description of what the slide should describe or accomplish]

              The current slides are:

              ${slides.value}
              `
            }
          ],
        });
        nextSlideOptions.value = response.content.trim();
      }
      let choice = await getResult(Input, <div>
        <MarkdownChooser text={nextSlideOptions.value + "\n1. Cancel"} />
      </div>);
      if (choice === "Cancel") {
        nextSlideOptions.value = "";
        continue;
      }
      let [header, description] = choice.split(/[:-]/, 2);
      description = description || "";
      const nextSlideResponse = await gpt.chat({
        messages: [
          {
            role: "system", content: tmpl`
            You are a slide assistant. You help people make slides. You like snappy, fun slides with subtle jokes, all while being informative.
            `
          },
          {
            role: "user", content: tmpl`
            ${instructions.value}

            I'm making slides for a presentation. Each "## Heading" is a new slide.

            The next slide will be titled "${header.trim()}" and is described: "${description.trim()}"

            Create a numbered list of at least 20 ideas for points to make on the slide.

            For reference the slides leading up to this one are:

            ${slides.value}

            ## ${header.trim()}
            `
          },
        ]
      });
      const bullets = await getResult(Input, <div>
        <MarkdownChooser multiple={true} text={nextSlideResponse.content.trim() + "\n1. Cancel"} />
      </div>);
      if (bullets.includes("Cancel")) {
        // FIXME: Cancels back too far, and is weird
        continue;
      }
      const list = bullets.map((bullet) => "- " + bullet.trim()).join("\n");
      slides.value = slides.value + "\n\n" + `## ${header.trim()}\n\n${description.trim()}\n\n${list}`;
      nextSlideOptions.value = "";
    }
  }
}

const Slides = () => {
  if (!slidesSplit.value.length) {
    return <div>No slides</div>;
  }
  const index = (parseInt(hashParamsSignal.value.get("slide") || 0, 10) + slidesSplit.value.length) % slidesSplit.value.length;
  const slide = slidesSplit.value[index]
  return <div>
    <div>
      <Button onClick={() => updateHashParams({ slide: index - 1 })}>←</Button>
      <Button onClick={() => updateHashParams({ slide: index + 1 })}>→</Button>
      <span>{index + 1} / {slidesSplit.value.length}</span>
    </div>
    <div class="text-xs border-1 border-black rounded p-2">
      <Markdown text={slide} />
    </div>
  </div>
};
