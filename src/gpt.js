import { gpt3Key, gpt4Key, endpoint, modelPrefix } from "./key.js";
import { signal } from "@preact/signals";
import { persistentSignal } from "./persistentsignal.js";
import * as icons from "./components/icons";
import { H1 } from "./components/input";
import JSON5 from "json5";

const GPT_URL = "https://api.openai.com/v1/chat/completions";

export const gpt4Signal = persistentSignal("gpt.gpt4Signal", false);
export const temperatureSignal = persistentSignal("gpt.temperature", null);

export const defaultChatPrompt = {
};

function getGptUrl() {
  if (endpoint.value) {
    return endpoint.value;
  }
  return GPT_URL;
}

export class GPT {
  constructor(defaultOptions) {
    this.defaultOptions = defaultOptions || defaultChatPrompt;
    this.logs = signal([]);
    this.Log = this.Log.bind(this);
  }

  async chat(prompt) {
    prompt = Object.assign({}, this.defaultOptions, prompt);
    let reducer;
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
      if (!prompt.max_tokens) {
        prompt.max_tokens = 2000;
      }
    }
    if (prompt.reducer) {
      reducer = prompt.reducer;
      delete prompt.reducer;
    }
    if (temperatureSignal.value !== null) {
      prompt.temperature = temperatureSignal.value;
    }
    if (modelPrefix.value) {
      prompt.model = modelPrefix.value + prompt.model;
    }
    let resp;
    let retryLimit = 2;
    while (true) {
      resp = await fetch(getGptUrl(), {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${gpt4Signal.value ? gpt4Key.value || gpt3Key.value : gpt3Key.value}`,
          "X-Title": "FunGPT",
          "HTTP-Referer": `${location.origin}${location.pathname}`,
        },
        body: JSON.stringify(prompt),
      });
      response.end = Date.now();
      if (!resp.ok) {
        const body = await resp.json();
        if (body.error.code === "context_length_exceeded") {
          const exc = new OverlengthError("Maximum length exceeded", body);
          if (reducer) {
            const oldPromptLength = JSON.stringify(prompt.messages).length;
            prompt = reducer(prompt, exc);
            const newPromptLength = JSON.stringify(prompt.messages).length;
            console.log(`Overlength; trying again with shorter prompt ${oldPromptLength}→${newPromptLength}:`, exc.toString());
            continue;
          }
        }
        if (resp.status == 429) {
          // Overloaded error
          if (retryLimit > 0) {
            console.info("Overloaded; retrying:", body);
            retryLimit--;
            continue;
          }
        }
        console.error("Error from ChatGPT:", body);
        const exc = new Error(
          `ChatGPT request failed: ${resp.status} ${resp.statusText}: ${body.error.message}`
        );
        exc.request = resp;
        exc.errorData = body;
        throw exc;
      }
      break;
    }
    const json = await resp.json();
    response.json = json;
    this.logs.value = [response, ...this.logs.value.slice(1)];
    console.info("Got ChatGPT response:", json, response.isFunctionCall ? response.functionCall : response.content);
    return response;
  }

  async embedding(string) {
    const resp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gpt3Key.value}`,
      },
      body: JSON.stringify({
        text: string,
        "model": "text-embedding-ada-002",
      }),
    });
    const json = await resp.json();
    return json.data[0];
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
              <strong>
                {message.role}
                {message.role === "function" && message.name
                  ? ` ${message.name}()`
                  : ""}
                :
              </strong>
              {message.function_call
                ? `function call: ${message.function_call.name}(${formatArgs(
                  message.function_call.arguments
                )})`
                : message.content}
            </pre>
          ))}
        </div>
        {response.json ? (
          response.isFunctionCall ? (
            <pre class="text-xs whitespace-pre-wrap pl-6 -intent-4 bg-green-200">
              <strong>function call:</strong>{" "}
              {JSON.stringify(response.functionCall, null, 2)}
            </pre>
          ) : (
            <pre class="text-xs whitespace-pre-wrap pl-6 -indent-4 bg-green-200">
              <strong>response:</strong> {response.content}
            </pre>
          )
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
    this._parsed = undefined;
  }

  get isFunctionCall() {
    return !!this.json.choices[0].message.function_call;
  }

  get content() {
    const m = this.json.choices[0].message;
    if (m.function_call && !m.content) {
      throw new Error(
        `No content in response (function_call: ${m.function_call.name}())`
      );
    }
    return m.content;
  }

  get nContent() {
    return this.json.choices.map((choice) => choice.message.content);
  }

  get functionCall() {
    const m = this.json.choices[0].message;
    if (!m.function_call) {
      throw new Error(`No function call in response`);
    }
    const result = { ...m.function_call };
    try {
      result.arguments = JSON5.parse(result.arguments);
    } catch (e) {
      console.warn("Could not parse function call arguments:", result.arguments);
      throw e;
    }
    return result;
  }

  get parsed() {
    let content = this.content.trim();
    content = content.replace(/^`+/, "").replace(/`+$/, "").trim();
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

  parsedWithGptFix(gpt) {
    return this.catchParsed((content) => {
      return gpt.fixJsonWithGpt(content);
    });
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

export class OverlengthError extends Error {
  constructor(message, errorData) {
    const match = errorData.error.message.match(/maximum context length is (\d+) tokens.*you requested (\d+) tokens.*?(\d+) in the messages.*?(\d+) in the completion/);
    let lengths;
    if (match) {
      lengths = {
        maxContextLength: parseInt(match[1], 10),
        requestedLength: parseInt(match[2], 10),
        messagesLength: parseInt(match[3], 10),
        completionLength: parseInt(match[4], 10),
      };
      message = `${message} (${lengths.requestedLength}/${lengths.maxContextLength} tokens requested, ${lengths.messagesLength} input / ${lengths.completionLength} completion)`;
    }
    super(message);
    this.errorData = errorData;
    this.lengths = lengths;
  }
}

// Example error message:
/*
"This model's maximum context length is 4097 tokens. However, you requested 4107 tokens (3607 in the messages, 500 in the completion). Please reduce the length of the messages or completion."
*/

function formatArgs(args) {
  if (typeof args === "string") {
    args = JSON.parse(args);
  }
  return Object.entries(args)
    .map(([name, v]) => `${name}=${JSON.stringify(v)}`)
    .join(" ");
}
