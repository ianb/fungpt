const url = "https://api.openai.com/v1/chat/completions";
import { gpt3Key, gpt4Key } from "./key.js";
import { signal } from "@preact/signals";
import { persistentSignal } from "./persistentsignal.js";
import * as icons from "./components/icons";
import { H1 } from "./components/input";
import JSON5 from "json5";

export const gpt4Signal = persistentSignal("gpt.gpt4Signal", false);
export const temperatureSignal = persistentSignal("gpt.temperature", null);

export const defaultChatPrompt = {
};

export class GPT {
  constructor(defaultOptions) {
    this.defaultOptions = defaultOptions || defaultChatPrompt;
    this.logs = signal([]);
    this.Log = this.Log.bind(this);
  }

  async chat(prompt) {
    prompt = Object.assign({}, defaultChatPrompt, prompt);
    const response = new GPTResponse({ prompt });
    this.logs.value = [response, ...this.logs.value];
    console.info("Sending ChatGPT request:", prompt);
    response.start = Date.now();
    if (!prompt.model && gpt4Signal.value) {
      prompt.model = "gpt-4";
      delete prompt.max_tokens;
    } else if (prompt.model === "gpt-4") {
      delete prompt.max_tokens;
    } else {
      prompt.model = "gpt-3.5-turbo";
      prompt.max_tokens = 2000;
    }
    if (temperatureSignal.value !== null) {
      prompt.temperature = temperatureSignal.value;
    }
    const resp = await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gpt4Signal.value ? gpt4Key.value || gpt3Key.value : gpt3Key.value}`,
      },
      body: JSON.stringify(prompt),
    });
    response.end = Date.now();
    if (!resp.ok) {
      const body = await resp.json();
      console.error("Error from ChatGPT:", body);
      const exc = new Error(
        `ChatGPT request failed: ${resp.status} ${resp.statusText}: ${body.error.message}`
      );
      exc.request = resp;
      exc.errorData = body;
      throw exc;
    }
    const json = await resp.json();
    response.json = json;
    this.logs.value = [response, ...this.logs.value.slice(1)];
    console.info("Got ChatGPT response:", json, response.content);
    return response;
  }

  async fixJsonWithGpt(response) {
    if (typeof response !== "string") {
      response = response.content;
    }
    const result = await this.chat({
      messages: [
        { role: "user", content: `Fix this JSON:\n\n${response}` }
      ],
      model: "gpt-3.5-turbo",
    });
    return result.parsed;
  }

  Log({ }) {
    return <div>
      <H1>ChatGPT Logs</H1>
      {this.logs.value.map((response, i) => {
        return <LogItem response={response} index={i} hasJson={!!response.json} />
      })}
    </div>;
  }
}

const LogItem = ({ response, index, hasJson }) => {
  if (!response.expanded) {
    response.expanded = signal(null);
  }
  const open = response.expanded.value === null ? (
    index === 0 || !response.json
  ) : response.expanded.value;
  return <div class="mb-2">
    <div
      class="bg-gray-200 p-1 pl-2 mb-2 -mr-3 rounded-l text-xs cursor-default"
      onClick={() => response.expanded.value = !open}
    >
      {open ? (
        <icons.MinusCircle class="h-3 w-3 inline-block mr-2" />
      ) : (
        <icons.PlusCircle class="h-3 w-3 inline-block mr-2" />
      )}
      #{response.responseNumber} {" – "}
      {response.time ? (response.time / 1000).toFixed(1) + "s" : "... running"}
      {response.prompt.model === "gpt-4" ? <strong class="ml-2 text-amber-600">GPT-4</strong> : null}
    </div>
    {open ? (
      <>
        <div class={response.json ? "" : "bg-sky-200"}>
          {response.prompt.messages.map((message) => (
            <pre class="text-xs whitespace-pre-wrap pl-6 -indent-4">
              <strong>{message.role}:</strong> {message.content}
            </pre>
          ))}
        </div>
        {response.json ? (
          <pre class="text-xs whitespace-pre-wrap pl-6 -indent-4 bg-green-200">
            <strong>response:</strong> {response.content}
          </pre>
        ) : null}
      </>
    ) : null}
  </div>;
};

let responseNumber = 1;

class GPTResponse {
  constructor({ prompt, json }) {
    this.prompt = prompt;
    this.json = json;
    this.responseNumber = responseNumber++;
  }

  get content() {
    return this.json.choices[0].message.content;
  }

  get nContent() {
    return this.json.choices.map((choice) => choice.message.content);
  }

  get parsed() {
    let content = this.content;
    let bracket = content.indexOf("[");
    let brace = content.indexOf("{");
    if (bracket === -1) {
      if (brace !== -1) {
        content = content.slice(brace);
      }
    } else if (brace === -1) {
      if (bracket !== -1) {
        content = content.slice(bracket);
      }
    } else if (bracket < brace) {
      content = content.slice(bracket);
    } else {
      content = content.slice(brace);
    }
    return JSON5.parse(content);
  }

  catchParsed(failureCallback) {
    try {
      return this.parsed;
    } catch (e) {
      return failureCallback(this.content);
    }
  }

  get finishReason() {
    return this.json.choices[0].finish_reason;
  }

  get time() {
    if (!this.end) {
      return null;
    }
    return this.end - this.start;
  }
}
