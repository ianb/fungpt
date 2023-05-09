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
const messages = persistentSignal("roleplay-chat.messages", []);
const userName = persistentSignal("roleplay-chat.userName", "Sir John");
const userDescription = persistentSignal("roleplay-chat.userDescription", "A high-born noble");
const assistantName = persistentSignal("roleplay-chat.assistantName", "Tom");
const assistantDescription = persistentSignal("roleplay-chat.assistantDescription", `
a medieval peasant. He has never left his village and know nothing of the wider world. He is very ignorant, and doesn't even know enough to know of his own ignorance. He is fearful of new things and worries about demons or other evil spirits. He speaks using simple language.
`.trim());
const ChatInput = signal();

const RoleplayChat = ({ }) => {
  return <NeedsKey>
    <Page title="Chat/Roleplay" start={chat} src="chat/roleplay-chat.js">
      <Messages messages={messages} />
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

export default RoleplayChat;

/**** LOGIC LOOP ****/

async function chat() {
  while (true) {
    let content = await getResult(ChatInput, <div>
      <TextInput autoFocus="1" label="Enter a message:" placeholder="Say something" />
      <Button returns={{ action: "restart" }}>Restart</Button>
      <Button returns={{ action: "undo" }}>Undo</Button>
      <Button returns={{ action: "resetDescriptions" }}>Reset descriptions</Button>
    </div>);
    if (content.action === "restart") {
      messages.value = [];
      continue;
    } else if (content.action === "undo") {
      while (messages.value.length && messages.value[messages.value.length - 1].role !== "user") {
        messages.value = messages.value.slice(0, -1);
      }
      messages.value = messages.value.slice(0, -1);
      continue;
    } else if (content.action === "resetDescriptions") {
      for (const s of [userDescription, assistantDescription, userName, assistantName, messages]) {
        s.value = s.defaultValue;
      }
      continue;
    }
    messages.value = [...messages.value, { role: "user", content }];
    const response = await gpt.chat({
      messages: [
        {
          role: "system",
          content: tmpl`
          You are helping the user create dialog for a scene. The user will offer the dialog for the character ${userName.value} and you will create the dialog for the character ${assistantName.value}. Keep replies short. Be imaginative with details and visual descriptions.

          The character ${userName.value} is ${userDescription.value}.
          The character ${assistantName.value} is ${assistantDescription.value}.

          When formatting a reply you will always use the exact form:

          ${assistantName.value} says: "Hi _with a grin_"

          Description: An optional visual description of anything that happened (1-2 sentences)
          `
        },
        ...messages.value.slice(-14, -1).map(({ role, content, annotations }) => (
          { role, content: `${role === "user" ? userName.value : assistantName.value} says: "${content}"${annotations ? "\n\nDescription: " + annotations.join(", ") : ""}` }
        )),
        {
          role: "user",
          content: tmpl`
          ${userName.value} says: "${content}"

          Reply with:

          ${assistantName.value} says: "[dialog]"

          Description: [visual description with some internal thoughts]
          `
        }
      ],
      max_tokens: 500,
    });
    const quoteMatch = /[^"]*"(.*?)"/.exec(response.content);
    let actionMatch = /Description:\s*(.*)$/m.exec(response.content);
    if (!actionMatch) {
      actionMatch = /"([^"]+)$/.exec(response.content);
    }
    const annotations = actionMatch && actionMatch[1].trim() ? { annotations: [actionMatch[1]] } : {};
    const quote = quoteMatch ? quoteMatch[1] : `_${response.content}_`;
    messages.value = [...messages.value, { role: "assistant", content: quote, ...annotations }];
  }
}
