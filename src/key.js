import { persistentSignal } from "./persistentsignal";
import { Page, FreeChunk } from "./components/page";

export const gpt3Key = persistentSignal("gptkey.gpt3Key", "");
export const gpt4Key = persistentSignal("gptkey.gpt4Key", "");

export const hasKey = () => {
  return !!gpt3Key.value;
};

export const ShowKeyMessage = () => {
  return <Page title="GPT key required">
    <FreeChunk>
      <div class="flex flex-col items-center">
        <div class="mx-auto p-20">
          <div class="text-2xl font-bold mb-4">GPT key required</div>
          <div>
            <a
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              href="/gptkey"
            >
              You must enter your OpenAI GPT key to use this app. Click here to enter your key.
            </a>
          </div>
        </div>
      </div>
    </FreeChunk>
  </Page>;
};

export const NeedsKey = ({ children }) => {
  if (hasKey()) {
    return children;
  }
  return <ShowKeyMessage />;
}
