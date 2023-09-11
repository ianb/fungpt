import { useEffect } from "preact/hooks";
import { gpt3Key, gpt4Key, endpoint, modelPrefix } from "../../key";
import { Page } from "../../components/page";
import { A, TextInput, Button } from "../../components/input";

const GptKey = () => {
  useEffect(async () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("return") === "openrouter.ai" && params.get("code")) {
      const code = params.get("code");
      const resp = await fetch("https://openrouter.ai/api/v1/auth/keys", {
        method: 'POST',
        body: JSON.stringify({
          code,
        })
      });
      const body = await resp.json();
      console.log("Received key from openrouter.ai:", body);
      if (body.key) {
        gpt3Key.value = body.key;
        endpoint.value = "https://openrouter.ai/api/v1/chat/completions";
        modelPrefix.value = "openai/";
      }
      setTimeout(() => {
        const u = new URL(location.href);
        u.search = "";
        location.href = u.toString();
      }, 500);
    }
  });
  const callbackUrl = `${location.origin}${location.pathname}?return=openrouter.ai`;
  return <Page title="Set your GPT key">
    <div>
      <p class="py-1">
        This application requires a GPT API key. To use it you must enter one
        here; it will be stored locally in this browser and be used only to
        make requests from this browser to GPT-3 directly. If you just want
        to test this you can create a key and then delete it.
      </p>
      <p class="py-1">
        If you do not have a key you can sign up at{" "}
        <A href="https://openai.com/api/">openai.com/api</A> and then create
        a key at{" "}
        <A href="https://beta.openai.com/account/api-keys">
          beta.openai.com/account/api-keys
        </A>
      </p>
    </div>
    <div>
      <div>
        <TextInput signal={gpt3Key} label={gpt3Key.value ? "GPT API key SET!" : "Enter GPT API key"} />
      </div>
      <div>
        <p>
          If you wish to use a different key specifically for GPT-4 requests, you may enter it here (otherwise your main key will be used):
        </p>
        <TextInput signal={gpt4Key} label="GPT-4 API key" />
      </div>
      <div>
        <p>Finally if you want you can use <A href="openrouter.ai">openrouter.ai</A>:</p>
        <div>
          <a class="bg-magenta hover:bg-blue-700 text-white py-1 px-2 rounded-lg m-1" href={`https://openrouter.ai/auth?callback_url=${encodeURIComponent(callbackUrl)}`}>
            Use openrouter.ai
          </a>
        </div>
        {endpoint.value && <div>
          <Button onClick={() => {
            endpoint.value = null;
            gpt3Key.value = null;
            modelPrefix.value = "";
          }}>Clear Openrouter.ai key</Button>
        </div>}
      </div>
    </div>
  </Page >;
};

export default GptKey;
