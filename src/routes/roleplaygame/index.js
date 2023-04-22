import { GPT } from "../../gpt";
import { tmpl } from "../../template";
import { getResult } from "../../components/callback";
import { signal } from "@preact/signals";
import { TextInput, TextArea, Button } from "../../components/input";
import { Page } from "../../components/page";
import { useEffect } from "preact/hooks";
import { Messages } from "../../components/messages";
import { persistentSignal } from "../../persistentsignal";
import { Markdown } from "../../markdown";

const gpt = new GPT();
const initialWorldState = persistentSignal("rp-initialWorldState", "");
const worldState = persistentSignal("rp-worldState", "");
const character = persistentSignal("rp-character", "");
const WorldInput = signal();
const history = persistentSignal("rp-history", []);

const RolePlayGame = ({ }) => {
  useEffect(() => {
    rolePlayGame();
  }, []);
  return <Page title="Role Play Game">
    <div>
      <div class="bg-sky-300 p-2 m-2 rounded-lg">
        <Markdown text={worldState.value} />
      </div>
      <Messages messages={history} />
    </div>
    {WorldInput.value || <div>Loading...</div>}
    <gpt.Log />
  </Page>;
};

export default RolePlayGame;

async function rolePlayGame() {
  if (!worldState.value) {
    worldState.value = initialWorldState.value;
  }
  while (true) {
    let content = await getResult(WorldInput, <div>
      <TextInput autoFocus="1" label="What do you do?" />
      <Button returns={{ action: "restart" }}>Restart</Button>
      <TextArea label="Starting world state:" signal={initialWorldState} />
      <div><Button returns={{ action: "generateWorldState" }}>Generate some world state</Button></div>
      <TextArea label="Your character:" signal={character} />
      <div><Button returns={{ action: "generateCharacter" }}>Generate a character</Button></div>
    </div>);
    if (content.action === "restart") {
      worldState.value = initialWorldState.value;
      history.value = [];
      continue;
    }
    if (content.action === "generateWorldState") {
      const gen = await gpt.chat({
        messages: [
          {
            role: "system", content: tmpl`
            You are a gamemaster running a game.

            [[The user is a player, playing the character ${character.value}.]]

            Generate a description of the game environment with:
            * Brief history the player and their mission or goal
            * A description of the exact location the player is at, who is with them, and the situation. Make it a moment of tension or conflict.
            ` },
          {
            role: "user", content: tmpl`
            Generate a world state as 2-3 paragraphs of description.

            [[As inspiration use the following: ${initialWorldState.value}]]
            ` },
        ]
      });
      initialWorldState.value = gen.content;
      continue;
    }
    if (content.action === "generateCharacter") {
      const gen = await gpt.chat({
        messages: [
          {
            role: "system", content: tmpl`
          You are a gamemaster running a game.

          [[You are running a game set in: ${initialWorldState.value}.]]

          You will generate a character that is interesting and fun for the player to play.
          ` },
          {
            role: "user", content: tmpl`
          Generate a character 2-3 sentences of description, including a physical description and a their skills.

          [[As inspiration use the following: ${character.value}]]
          ` },
        ]
      });
      character.value = gen.content;
      continue;
    }
    const response = await gpt.chat({
      messages: [
        {
          role: "system", content: tmpl`
          You are a gamemaster running a game. The user is a player, playing the character ${character.value}.

          You will let the player have some freedom, but not freedom from consequences. You will also try to keep the game moving forward. If the player tries to do something really inappropriate you may ignore or reject that.
          `
        },
        {
          role: "user", content: tmpl`
          I would like to do this: ${content}

          The worldState is:
          """
          ${worldState.value}
          """

          Respond with JSON like:

          {
            isAllowed: true, // false if you want to reject the action
            isSociallyAppropriate: true, // false if the action is something socially inappropriate
            newWorldState: "[the world state after the action is performed]", // this will replace the current worldState
            notes: "[anything you want to say to the player]",
          }
          `
        },
      ]
    });
    const p = response.catchParsed((text) => {
      return { isAllowed: false, notes: text }
    });
    if (!p.isAllowed) {
      history.value = [...history.value, { role: "user", content: `${content}\n\n_Not allowed_` }, { role: "assistant", content: p.notes }];
      continue;
    }
    history.value = [...history.value, { role: "user", content }];
    if (p.notes) {
      history.value = [...history.value, { role: "assistant", content: p.notes }];
    }
    worldState.value = p.newWorldState;
  }
}
