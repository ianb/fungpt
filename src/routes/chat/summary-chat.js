import { signal } from "@preact/signals";
import { persistentSignal } from "../../persistentsignal";
import { GPT } from "../../gpt";
import { getResult } from "../../components/callback";
import { TextInput, TextArea, Button } from "../../components/input";
import { Page } from "../../components/page";
import { MessageTranscript } from "../../components/messagetranscript";
import { NeedsKey } from "../../key";
import { tmpl } from "../../template";
import { ImportExportPopup } from "../../components/importexport";
import { parseTags, serializeTags } from "../../parsetags";

const gpt = new GPT();
const messages = persistentSignal("summary-chat.messages", []);
const summaries = persistentSignal("summary-chat.summaries", []);
const userName = persistentSignal("summary-chat.userName", "Sir John");
const userDescription = persistentSignal("summary-chat.userDescription", "A high-born noble");
const assistantName = persistentSignal("summary-chat.assistantName", "Tom");
const assistantDescription = persistentSignal("summary-chat.assistantDescription", `
a medieval peasant. He has never left his village and know nothing of the wider world. He is very ignorant, and doesn't even know enough to know of his own ignorance. He is fearful of new things and worries about demons or other evil spirits. He speaks using simple language.
`.trim());
const sceneDescription = persistentSignal("summary-chat.sceneDescription", `
# Relationship to {{userName}}
- Not yet established

# Factual memories
- Not yet established

# Internal dialog and emotional progression
- Not yet established

# Scene
{{assistantName}} is working the fields when {{userName}} comes upon him, surprising him.
`.trim());
const descriptionLength = persistentSignal("summary-chat.descriptionLength", "1-2 sentences");
const Input = signal();

const SummaryChat = ({ }) => {
  return <NeedsKey>
    <Page
      title="Chat/Summary"
      start={chat}
      src="chat/summary-chat.js"
      headerButtons={[<ImportExportPopup title={assistantName.value} appId="saves.summary-chat" signals={{ messages, summaries, userName, userDescription, assistantName, assistantDescription, descriptionLength }} />]}
    >
      <MessageTranscript messages={messages} userName={userName.value} assistantName={assistantName.value} />
      <div>
        {Input.value || <div>Loading...</div>}
        <TextInput label="Description length:" signal={descriptionLength} />
        <TextInput label="Assistant name:" signal={assistantName} />
        <TextArea label={`${assistantName.value} is...`} signal={assistantDescription} />
        <TextInput label="User name:" signal={userName} />
        <TextArea label={`${userName.value} is...`} signal={userDescription} />
        <TextArea label="Scene description:" signal={sceneDescription} />
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
  let defaultValue;
  while (true) {
    let content = await getResult(Input, <div>
      <TextInput autoFocus="1" label="Enter a message:" placeholder="Say something" defaultValue={defaultValue} />
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
      const lastMessage = messages.value[messages.value.length - 1];
      defaultValue = lastMessage.actions.find(a => a.type === "dialog").content;
      if (lastMessage.commands) {
        defaultValue = `${defaultValue} [${lastMessage.commands}]`;
      }
      messages.value = messages.value.slice(0, -1);
      console.log("undo", messages.value.length, summaries.value, summaries.value.length && summaries.value[summaries.value.length - 1].index, summaries.value.length && summaries.value[summaries.value.length - 1].index >= messages.value.length);
      if (summaries.value.length && summaries.value[summaries.value.length - 1].index >= messages.value.length) {
        summaries.value = summaries.value.slice(0, -1);
      }
      continue;
    } else if (content.action === "resetDescriptions") {
      if (!confirm("Are you sure you want to reset the descriptions?")) {
        continue;
      }
      for (const s of [userDescription, assistantDescription, userName, assistantName, messages, summaries]) {
        s.value = s.defaultValue;
      }
      continue;
    } else if (content.action === "clearSummaries") {
      summaries.value = [];
      continue;
    }
    defaultValue = "";
    let commands = [];
    let dialog = content.replace(/\s*\[([^\]]+)\]/g, (_, command) => {
      commands.push(command);
      return "";
    }).trim();
    commands = commands.join("\n");
    messages.value = [...messages.value, { role: "user", actions: [{ type: "dialog", character: userName.value, content: dialog }], commands }];
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
      summary = sceneDescription.value;
      summary = summary.replace(/{{userName}}/g, userName.value);
      summary = summary.replace(/{{assistantName}}/g, assistantName.value);
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

          These are lists of relevant background for ${assistantName.value}:
          """
          ${summary}
          """
          `
        },
        ...recentMessages.slice(0, -1).map(({ role, actions }) => {
          const message = { role };
          message.content = serializeTags(actions);
          message.content = message.content.slice(0, 1200);
          return message;
        }),
        {
          role: "user",
          content: tmpl`
          <dialog character="${userName.value}">
          ${dialog}
          </dialog>

          Reply with:

          <decision-process character="${assistantName.value}">
          [ONE sentence where ${assistantName.value} considers what to do say or do next; when the choice is critical list and consider multiple options. Be concise, do not let ${assistantName.value} dwell on the same issues]
          </decision-process>

          <dialog character="${assistantName.value}">
          [what ${assistantName.value} says or does]
          </dialog>

          <thoughts-and-emotions character="${assistantName.value}">
          [1-2 sentences describing ${assistantName.value}'s inner monologue, thoughts, or feelings. Be concise and describe changes, do not let ${assistantName.value} dwell repeatedly on the same issues]
          </thoughts-and-emotions>

          <description>
          [Unless other instructions indicate otherwise, ${descriptionLength.value} of visual description or a description of events. Only include this tag if ${assistantName.value} performed some action or there is something notable to describe]
          </description>

          [[When the reply make note of these instructions: ${commands}]]
          `
        }
      ],
      reducer: reduceConversationMessages,
      max_tokens: 500,
    });
    let actions = parseTags(response.content);
    actions = trimBadDialog(dialog, userName.value, actions);
    messages.value = [...messages.value, { role: "assistant", actions }];
  }
}

async function makeSummary(summary, recentMessages) {
  const log = recentMessages.map(({ role, actions }) => {
    return serializeTags(actions);
  }).join("\n\n");
  const response = await gpt.chat({
    messages: [
      {
        role: "system",
        content: tmpl`
        You are a story and conversation analyst. You will be given dialog between ${userName.value} and ${assistantName.value}, as well as descriptions and observations from the perspective of ${assistantName.value}.

        For your information only (this information is not updated and should not be duplicated in the summary):

        """
        ${assistantName.value} is ${assistantDescription.value.trim()}.
        ${userName.value} is ${userDescription.value.trim()}.
        """

        Given the dialog you will update a list in this format (the list created entirely from the perspective of ${assistantName.value}):

        # Relationship to ${userName.value}
        A numbered list of important facts, observations, opinions, feelings, or memories from the persective of ${assistantName.value} about ${userName.value}.
        Especially note:
        1. ${assistantName.value}'s feelings toward ${userName.value}
        2. ${assistantName.value}'s observations of ${userName.value}

        # Core memory scenes
        When there is an important/pivotal scene or interaction, such that the scene itself should be remembered, write a one-sentence description of the scene. Combine entries for brevity. Important scenes should be marked IMPORTANT and should be kept whenever possible, unless it is possible to combine IMPORTANT items together into one item.

        # Factual memories
        A list of important objective facts that have been established in the conversation. These can be:
        1. Established facts about ${userName.value}
        2. Established facts about ${assistantName.value}
        3. Established facts about the world
        4. Established history about ${userName.value} or ${assistantName.value}

        # Internal dialog and emotional progression
        A chronological list of ${assistantName.value}'s most important internal thoughts and feelings. Redundant or out-of-date entries should be omitted. The list should be updated as ${assistantName.value}'s thoughts and feelings change.

        # Scene
        The CURRENT state of the scene:
        1. The current location
        2. Any physical features of the location that are notable given the dialog or action of the scene
        3. Any notable characters present besides ${userName.value} and ${assistantName.value}
        `,
      },
      {
        role: "user",
        content: tmpl`
        Given the following dialog:

        """
        ${log}
        """

        You should update this list; retain anything important from this list, but omit or combine redudant, out-of-date, or moot entries. You should prefer to amend existing items when possible. You may revise entries with new information, or add new information as new items in the lists. Each sublist should have at most 6 items.

        Old list:

        """
        ${summary}
        """

        New list:
        `,
      },
    ],
    max_tokens: 1000,
  });
  return response.content;
}

function trimBadDialog(userDialog, userName, actions) {
  return actions.filter(action => {
    return !(action.type === "dialog" && action.character === userName && looseMatch(action.content, userDialog));
  });
}

function looseMatch(a, b) {
  console.log([normalize(a), normalize(b)]);
  return normalize(a) === normalize(b);
}

function normalize(s) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function reduceConversationMessages(prompt, exc) {
  const biggest = Math.max(...prompt.messages.slice(1, -1).map(({ content }) => content.length));
  const newPrompt = { ...prompt };
  const limit = Math.floor(biggest * 0.9);
  newPrompt.messages = prompt.messages.map(({ content, ...rest }, i) => {
    if (i === 0 || i === prompt.messages.length - 1) {
      return { content, ...rest };
    }
    if (content.length > limit) {
      console.log(`Trimming message #${i + 1}: ${content.length}→${limit}`);
      content = content.slice(0, limit);
    }
    return { content, ...rest };
  });
  return newPrompt;
}
