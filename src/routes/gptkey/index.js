import { gpt3Key, gpt4Key } from "../../key";
import { Page } from "../../components/page";
import { A, TextInput } from "../../components/input";

const GptKey = () => {
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
        <TextInput signal={gpt3Key} label="GPT API key" />
      </div>
      <div>
        <p>
          If you wish to use a different key specifically for GPT-4 requests, you may enter it here (otherwise your main key will be used):
        </p>
        <TextInput signal={gpt4Key} label="GPT-4 API key" />
      </div>
    </div>
  </Page>;
};

export default GptKey;
