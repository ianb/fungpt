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
const messages = persistentSignal("summary-chat.messages", []);
const summaries = persistentSignal("summary-chat.summaries", []);
const userName = persistentSignal("summary-chat.userName", "Sir John");
const userDescription = persistentSignal("summary-chat.userDescription", "A high-born noble");
const assistantName = persistentSignal("summary-chat.assistantName", "Tom");
const assistantDescription = persistentSignal("summary-chat.assistantDescription", `
a medieval peasant. He has never left his village and know nothing of the wider world. He is very ignorant, and doesn't even know enough to know of his own ignorance. He is fearful of new things and worries about demons or other evil spirits. He speaks using simple language.
`.trim());
const Input = signal();

const SummaryChat = ({ }) => {
  return <NeedsKey>
    <Page title="Chat/Summary" start={chat} src="chat/summary-chat.js">
      <Messages messages={messages} />
      <div>
        {Input.value || <div>Loading...</div>}
        <TextInput label="User name:" signal={userName} />
        <TextArea label={`${userName.value} is...`} signal={userDescription} />
        <TextInput label="Assistant name:" signal={assistantName} />
        <TextArea label={`${assistantName.value} is...`} signal={assistantDescription} />
      </div>
      <gpt.Log />
    </Page>
  </NeedsKey>;
};

export default SummaryChat;

/**** LOGIC LOOP ****/

// Keep this many messages at most in history:
const RETAIN = 16;
// When summarizing keep this many messages that aren't summarized away:
const ALWAYS_RETAIN = 6;

async function chat() {
  while (true) {
    let content = await getResult(Input, <div>
      <TextInput autoFocus="1" label="Enter a message:" placeholder="Say something" />
      <Button returns={{ action: "restart" }}>Restart</Button>
      <Button returns={{ action: "undo" }}>Undo</Button>
      <Button returns={{ action: "resetDescriptions" }}>Reset descriptions</Button>
      <Button returns={{ action: "clearSummaries" }}>Clear Summaries</Button>
    </div>);
    if (content.action === "restart") {
      messages.value = [];
      summaries.value = [];
      continue;
    } else if (content.action === "undo") {
      while (messages.value.length && messages.value[messages.value.length - 1].role !== "user") {
        messages.value = messages.value.slice(0, -1);
      }
      messages.value = messages.value.slice(0, -1);
      console.log("undo", messages.value.length, summaries.value, summaries.value[summaries.value.length - 1].index, summaries.value[summaries.value.length - 1].index >= messages.value.length);
      if (summaries.value.length && summaries.value[summaries.value.length - 1].index >= messages.value.length) {
        summaries.value = summaries.value.slice(0, -1);
      }
      continue;
    } else if (content.action === "resetDescriptions") {
      for (const s of [userDescription, assistantDescription, userName, assistantName, messages, summaries]) {
        s.value = s.defaultValue;
      }
      continue;
    } else if (content.action === "clearSummaries") {
      summaries.value = [];
      continue;
    }
    let commands = [];
    let dialog = content.replace(/\s*\[([^\]]+)\]/g, (_, command) => {
      commands.push(command);
      return "";
    }).trim();
    messages.value = [...messages.value, { role: "user", content: dialog }];
    let recentMessages;
    let index;
    let summary;
    if (summaries.value.length) {
      const recentSummary = summaries.value[summaries.value.length - 1];
      index = recentSummary.index;
      summary = recentSummary.summary;
      recentMessages = messages.value.slice(index);
    } else {
      index = 0;
      summary = "";
      recentMessages = messages.value;
    }
    if (recentMessages.length > RETAIN) {
      summary = await makeSummary(summary, messages.value.slice(index, -ALWAYS_RETAIN));
      index = messages.value.length - ALWAYS_RETAIN;
      summaries.value = [...summaries.value, { index, summary }];
      recentMessages = recentMessages.slice(-ALWAYS_RETAIN);
    }
    dialog = dialog ? `"${dialog}"` : "nothing for now";
    const response = await gpt.chat({
      messages: [
        {
          role: "system",
          content: tmpl`
          You are helping the user create dialog for a scene. The user will offer the dialog for the character ${userName.value} and you will create the dialog for the character ${assistantName.value}. Keep replies short. Be imaginative with details and visual descriptions. "_action_" means an action that the character takes.

          The character ${userName.value} is ${userDescription.value.trim()}.
          The character ${assistantName.value} is ${assistantDescription.value.trim()}.

          [[So far this is what has happened: ${summary}]]

          When formatting a reply you will always use the exact form:

          ${assistantName.value} says: "Hi _with a grin_"

          Description: An optional visual description of anything that happened (1-3 sentences)
          `
        },
        ...recentMessages.slice(0, -1).map(({ role, content, annotations }) => (
          { role, content: `${role === "user" ? userName.value : assistantName.value} says: "${content}"${annotations ? "\n\nDescription: " + annotations.join(", ") : ""}` }
        )),
        {
          role: "user",
          content: tmpl`
          ${userName.value} says: ${dialog}

          Reply with:

          ${assistantName.value} says: "[dialog]"

          Description: [Unless a command indicates otherwise, use no more than 1 sentence of visual description and no more than 1-2 sentences of internal thoughts]

          ${commands}
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

async function makeSummary(summary, recentMessages) {
  const log = recentMessages.map(({ role, content, annotations }) => {
    const says = content ? `says: "${content}"` : "says nothing";
    let logItem = `${role === "user" ? userName.value : assistantName.value} ${says}`;
    if (annotations) {
      if (!Array.isArray(annotations)) {
        annotations = [annotations];
      }
      for (let annotation of annotations) {
        if (typeof annotation === "string") {
          annotation = { tag: "Description", content: annotation };
        }
        logItem += `\n${annotation.tag || "Description"}: ${annotation.content}`;
      }
    }
    return logItem;
  }).join("\n\n");
  const response = await gpt.chat({
    messages: [
      {
        role: "system",
        content: tmpl`
        You are a conversation expert. You will be given the dialog between ${userName.value} and ${assistantName.value} as well as descriptions and observations from the perspective of ${assistantName.value}.
        `,
      },
      {
        role: "user",
        content: tmpl`
        Dialog and descriptions so far:

        [[Previous list/summary:
        """
        ${summary}
        """]]

        Further dialog:

        """
        ${log}
        """

        You will create a new list of the most important facts and events that happen in the scene, including important information from previous summaries. Omit duplicate or out-of-date facts. You will emphasize ${assistantName.value}'s internal thoughts and feelings. You will summarize previous dialog but not repeat it verbatim. You will specify only the current environment or location. The list will be used to continue to compose ${assistantName.value}'s dialog.
        `,
      },
    ],
  });
  return response.content;
}
