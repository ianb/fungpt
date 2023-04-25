import { signal } from "@preact/signals";
import { persistentSignal } from "../../persistentsignal";
import { GPT } from "../../gpt";
import { getResult } from "../../components/callback";
import { TextInput, TextArea, Button } from "../../components/input";
import { Page } from "../../components/page";
import { Messages } from "../../components/messages";
import { NeedsKey } from "../../key";

const gpt = new GPT();
const messages = persistentSignal("fancy-chat.messages", []);
const systemPrompt = persistentSignal("fancy-chat.systemPrompt", "Respond like you are a very cool dude");
const ChatInput = signal();

const FancyChat = ({ }) => {
  return <NeedsKey>
    <Page title="Fancy Chat" start={chat}>
      <Messages messages={messages} />
      <div>
        {ChatInput.value || <div>Loading...</div>}
        <TextArea label="System prompt:" signal={systemPrompt} />
      </div>
      <gpt.Log />
    </Page>
  </NeedsKey>;
};

export default FancyChat;

/**** LOGIC LOOP ****/

async function chat() {
  while (true) {
    let content = await getResult(ChatInput, <div>
      <TextInput autoFocus="1" label="Enter a message:" placeholder="Say something" />
      <Button returns={{ action: "restart" }}>Restart</Button>
      {messages.value.length > 0 && <Button returns={{ action: "undo" }}>Undo</Button>}
      <Button returns={{ action: "replay" }}>Replay</Button>
    </div>);
    if (content.action === "restart") {
      messages.value = [];
      continue;
    }
    if (content.action === "undo") {
      do {
        messages.value = messages.value.slice(0, -1);
      } while (messages.value.length > 0 && messages.value[messages.value.length - 1].role === "user");
      continue;
    }
    if (content.action === "replay") {
      const replays = messages.value.filter(m => m.role === "user");
      messages.value = [];
      for (const replay of replays) {
        messages.value = [...messages.value, replay];
        const response = await gpt.chat({
          messages: [
            { role: "system", content: systemPrompt.value },
            ...messages.value
          ],
        });
        messages.value = [...messages.value, { role: "assistant", content: response.content }];
      }
      continue;
    }
    messages.value = [...messages.value, { role: "user", content }];
    const response = await gpt.chat({
      messages: [
        { role: "system", content: systemPrompt.value },
        ...messages.value
      ],
    });
    messages.value = [...messages.value, { role: "assistant", content: response.content }];
  }
}
