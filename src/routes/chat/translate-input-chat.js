import { signal } from "@preact/signals";
import { persistentSignal } from "../../persistentsignal";
import { GPT } from "../../gpt";
import { tmpl } from "../../template";
import { getResult } from "../../components/callback";
import { TextInput, TextArea, Button } from "../../components/input";
import { Page } from "../../components/page";
import { Messages } from "../../components/messages";
import { NeedsKey } from "../../key";

const gpt = new GPT();
const messages = signal([]);
const systemPrompt = persistentSignal("translate-input-chat.systemPrompt", "You play the part of a friendly bard at the local tavern. The setting is medieval times. You are curious to hear new stories.");
const translationPrompt = persistentSignal("translate-input-chat.translationPrompt", `
You are helping the user role play as a medieval wizard. Whatever the user says you should reply with a phrase with the same meaning, but using speech that is appropriate for a medieval wizard.

Example:
user: translate: "Howdy!"
assistant: Good day sir!
`.trim());
const ChatInput = signal();

const TranslateInputChat = ({ }) => {
  return <NeedsKey>
    <Page title="Chat/Translate Input" start={chat} src="chat/translate-input-chat.js">
      <Messages messages={messages} />
      <div>
        {ChatInput.value || <div>Loading...</div>}
        <TextArea label="System prompt:" signal={systemPrompt} />
        <TextArea label="Translation prompt:" signal={translationPrompt} placeholder="If you want the user's messages to be rephrased" />
      </div>
      <gpt.Log />
    </Page>
  </NeedsKey>;
};

export default TranslateInputChat;

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
