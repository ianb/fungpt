import { GPT } from "../../gpt";
import { tmpl } from "../../template";
import { getResult } from "../../components/callback";
import { signal } from "@preact/signals";
import { TextArea, Button } from "../../components/input";
import { Page } from "../../components/page";
import { Messages } from "../../components/messages";
import { persistentSignal } from "../../persistentsignal";
import { NeedsKey } from "../../key";

const gpt = new GPT();
const messages = signal([]);
const systemPrompts = {
  char1: persistentSignal("selfchat.char1", "Respond like you are a very cool dude"),
  char2: persistentSignal("selfchat.char2", "Respond like you are a very mean dude"),
};
const ContinueInput = signal();

const SelfChat = () => {
  return <NeedsKey>
    <Page title="Self-Chat" start={selfChat} src="selfchat/index.js">
      <Messages messages={messages} />
      <div>
        {ContinueInput.value || <div>Loading...</div>}
        <TextArea label="Character 1 prompt:" signal={systemPrompts.char1} />
        <TextArea label="Character 2 prompt:" signal={systemPrompts.char2} />
      </div>
      <gpt.Log />
    </Page>
  </NeedsKey>;
};

export default SelfChat;

/**** LOGIC LOOP ****/

async function selfChat() {
  while (true) {
    let next = "char1";
    if (messages.value.length && messages.value[messages.value.length - 1].role === "char1") {
      next = "char2";
    }
    const action = await getResult(ContinueInput, <div>
      <Button returns="continue">Continue with {next}</Button>
      <Button returns="restart">Restart</Button>
    </div>);
    if (action === "restart") {
      messages.value = [];
      continue;
    }
    let userAssistant = messages.value.map((message) => {
      return { role: message.role === next ? "assistant" : "user", content: message.content };
    });
    const response = await gpt.chat({
      messages: [
        { role: "system", content: systemPrompts[next].value },
        ...userAssistant,
      ],
    });
    messages.value = [...messages.value, { role: next, content: response.content }];
  }

}
