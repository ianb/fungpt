import { signal } from "@preact/signals";
import { persistentSignal } from "../../persistentsignal";
import { GPT } from "../../gpt";
import { tmpl } from "../../template";
import { getResult } from "../../components/callback";
import { TextInput, TextArea, Button } from "../../components/input";
import { Page } from "../../components/page";
import { Messages } from "../../components/messages";

const gpt = new GPT();
const messages = signal([]);
const systemPrompt = persistentSignal("chat3.systemPrompt", "Respond like you are a very cool dude");
const translationPrompt = persistentSignal("chat3.translationPrompt", "");
const ChatInput = signal();

const Chat3 = ({ }) => {
  return <Page title="Chat 3" start={chat}>
    <Messages messages={messages} />
    <div>
      {ChatInput.value || <div>Loading...</div>}
      <TextArea label="System prompt:" signal={systemPrompt} />
      <TextArea label="Translation prompt:" signal={translationPrompt} placeholder="If you want the user's messages to be rephrased" />
    </div>
    <gpt.Log />
  </Page>;
};

export default Chat3;

/**** LOGIC LOOP ****/

async function chat() {
  while (true) {
    let content = await getResult(ChatInput, <div>
      <TextInput autoFocus="1" label="Enter a message:" placeholder="Say something" />
      <Button returns={{ action: "restart" }}>Restart</Button>
    </div>);
    if (content.action === "restart") {
      messages.value = [];
      continue;
    }
    const translation = await gpt.chat({
      messages: [
        { role: "system", content: translationPrompt.value },
        {
          role: "user", content: tmpl`
          Translate this: "${content}"
          `
        },
      ],
    });
    content = translation.content;
    messages.value = [...messages.value, { role: "user", content }];
    const prompt = {
      messages: [
        { role: "system", content: systemPrompt.value },
        ...messages.value
      ],
    };
    const response = await gpt.chat(prompt);
    messages.value = [...messages.value, { role: "assistant", content: response.content }];
  }
}
