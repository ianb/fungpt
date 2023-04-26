import { GPT } from "../../gpt";
import { tmpl } from "../../template";
import { getResult } from "../../components/callback";
import { signal } from "@preact/signals";
import { TextInput, TextArea, Button } from "../../components/input";
import { Page } from "../../components/page";
import { Messages } from "../../components/messages";
import { persistentSignal } from "../../persistentsignal";
import { NeedsKey } from "../../key";

const gpt = new GPT();
const messages = signal([]);
const systemPrompt = persistentSignal("chat2.systemPrompt", "Respond like you are a very cool dude");
const ChatInput = signal();

const EndingChat = ({ }) => {
  return <NeedsKey>
    <Page title="Chat 2" start={chat} src="chat/ending-chat.js">
      <Messages messages={messages} />
      <div>
        {ChatInput.value || <div>Loading...</div>}
        <TextArea label="System prompt:" signal={systemPrompt} />
      </div>
      <gpt.Log />
    </Page>
  </NeedsKey>;
};

export default EndingChat;

/**** LOGIC LOOP ****/

async function chat() {
  let isOver = false;
  while (true) {
    let content = await getResult(ChatInput, <div>
      {isOver ? null : <TextInput autoFocus="1" label="Enter a message:" placeholder="Say something" />}
      <Button returns={{ action: "restart" }}>Restart</Button>
    </div>);
    if (content.action === "restart") {
      messages.value = [];
      isOver = false;
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
    const isOverResponse = await gpt.chat({
      messages: [
        { role: "system", content: "You are a conversation analyst" },
        {
          role: "user", content: tmpl`
          This is a transcript of a conversation:
          """
          ${messages.value.map((message) => `${message.role}: ${message.content}`).join("\n\n")}
          """

          Is this conversation finished? Has either person indicated the conversation is over or said goodbye? (Conversations that end in a question generally are not over.) Reply with "yes" or "no".
          `
        },
      ],
    });
    isOver = /yes/i.test(isOverResponse.content);
  }
}
