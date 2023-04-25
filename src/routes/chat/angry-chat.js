import { signal, computed } from "@preact/signals";
import { persistentSignal } from "../../persistentsignal";
import { GPT } from "../../gpt";
import { getResult } from "../../components/callback";
import { TextInput, TextArea, Button } from "../../components/input";
import { Page } from "../../components/page";
import { Messages } from "../../components/messages";
import { NeedsKey } from "../../key";
import { tmpl } from "../../template";

const gpt = new GPT();
const messages = signal([]);
const viewableMessages = computed(() => {
  return messages.value.map(({ role, content }) => {
    return {
      role,
      content: /[^"]*"(.*?)"/.exec(content)[1]
    };
  });
});
const userName = persistentSignal("chat.userName", "Pat");
const userDescription = persistentSignal("chat.userDescription", "A very cool dude");
const assistantName = persistentSignal("chat.assistantName", "Kit");
const assistantDescription = persistentSignal("chat.assistantDescription", "Respond like you are a very cool dude");
const ChatInput = signal();

const AngryChat = ({ }) => {
  return <NeedsKey>
    <Page title="Chat" start={chat}>
      <Messages messages={viewableMessages} />
      <div>
        {ChatInput.value || <div>Loading...</div>}
        <TextInput label="User name:" signal={userName} />
        <TextArea label={`${userName.value} is...`} signal={userDescription} />
        <TextInput label="Assistant name:" signal={assistantName} />
        <TextArea label={`${assistantName.value} is...`} signal={assistantDescription} />
      </div>
      <gpt.Log />
    </Page>
  </NeedsKey>;
};

export default AngryChat;

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
    messages.value = [
      ...messages.value,
      {
        role: "user",
        content: tmpl`
        ${userName.value} says: "${content}"

        Reply with:

        ${assistantName.value} says: "..."
        `
      }
    ];
    const response = await gpt.chat({
      messages: [
        {
          role: "system",
          content: tmpl`
          You are helping the user create dialog for a scene. The user will offer the dialog for the character ${userName.value} and you will create the dialog for the character ${assistantName.value}.

          The character ${userName.value} is ${userDescription.value}.
          The character ${assistantName.value} is ${assistantDescription.value}.

          When formatting a reply you will always use the exact form:

          ${assistantName.value} says: "Hi _with a grin_"
          `
        },
        ...messages.value
      ],
    });
    messages.value = [...messages.value, { role: "assistant", content: response.content }];
  }
}
