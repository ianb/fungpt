import { signal } from "@preact/signals";
import { persistentSignal } from "../../persistentsignal";
import { GPT } from "../../gpt";
import { getResult } from "../../components/callback";
import { TextInput, TextArea, Button } from "../../components/input";
import { Page } from "../../components/page";
import { Messages } from "../../components/messages";
import { NeedsKey } from "../../key";

const gpt = new GPT();
const messages = signal([]);
const systemPrompt = persistentSignal("chat.systemPrompt", "Respond like you are a very cool dude");
const ChatInput = signal();

const SimpleChat = ({ }) => {
  return <NeedsKey>
    <Page title="Chat" start={chat} src="chat/simple-chat.js">
      <Messages messages={messages} />
      <div>
        {ChatInput.value || <div>Loading...</div>}
        <TextArea label="System prompt:" signal={systemPrompt} />
      </div>
      <gpt.Log />
    </Page>
  </NeedsKey>;
};

export default SimpleChat;

/**** LOGIC LOOP ****/

async function chat() {
  // messages.value == [{ role: "user", content: "hello"}, { role: "assistant", content: "Hi" }]
  while (true) {
    let content = await getResult(ChatInput, <div>
      <TextInput autoFocus="1" label="Enter a message:" placeholder="Say something" />
      <Button returns={{ action: "restart" }}>Restart</Button>
    </div>);
    if (content.action === "restart") {
      messages.value = [];
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
