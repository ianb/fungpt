import { GPT } from "../../gpt";
import { tmpl } from "../../template";
import { getResult } from "../../components/callback";
import { signal } from "@preact/signals";
import { TextInput, H1 } from "../../components/input";
import { Page } from "../../components/page";
import { NeedsKey } from "../../key";

const gpt = new GPT();
const secret = signal(null);
const questions = signal([]);
const QuestionAsker = signal();

const TwentyQuestions = ({ }) => {
  return <NeedsKey>
    <Page title="20 Questions" start={twentyQuestions} src="twentyquestions/index.js">
      <QuestionLog questions={questions} secret={secret} />
      {QuestionAsker.value || <div>Loading...</div>}
      <gpt.Log />
    </Page>
  </NeedsKey>;
};

export default TwentyQuestions;

const QuestionLog = ({ questions, secret }) => {
  if (!secret.value) {
    return <div>Loading...</div>;
  }
  return <div>
    <H1>Questions / Answers</H1>
    <div>
      You are guessing a <strong>{secret.value.category}</strong>
    </div>
    {questions.value.map((question) => {
      return <div>
        <div class="italic">{question.question}</div>
        <div class="font-bold ml-16 pl-2 border-l-2 border-magenta">{question.answer.answer}</div>
      </div>
    })}
  </div>;
};


/**** LOGIC LOOP ****/

async function twentyQuestions() {
  const answer = await gpt.chat({
    messages: [
      { role: "system", content: "You are playing 20 questions. First you must choose something for the user to guess. Respond with JSON." },
      {
        role: "user", content: tmpl`
        Choose something for the user to guess. Respond like:

        {
          category: "animal", // Or "person", "vegetable", "mineral"
          thing: "Dog", // Pick something creative
        }
      `}
    ]
  });
  secret.value = answer.parsed;
  let guessedCorrectly = false;
  for (let i = 0; i < 20; i++) {
    const question = await getResult(QuestionAsker, <div>
      <TextInput autoFocus="1" label="Ask a question:" />
    </div>);
    const response = await gpt.chat({
      messages: [
        {
          role: "system", content: tmpl`
            You are playing 20 questions with the user and they are trying to guess secret: "${secret.value.thing}". Respond with JSON.
            `
        },
        {
          role: "user", content: tmpl`
            I'm going to ask the question: "${question}"

            Respond with this JSON:

            {
              answer: "yes", // Or "no", "maybe"
              guessedCorrectly: false, // true if the user guessed the secret ("${secret.value.thing}")
            }
          `
        }
      ],
    });
    const answer = response.catchParsed((answer) => { return { answer, guessedCorrectly: false } });
    questions.value = [...questions.value, { question, answer }];
    if (answer.guessedCorrectly) {
      guessedCorrectly = true;
      break;
    }
  }
  QuestionAsker.value = guessedCorrectly ? <div>You got it!</div> : <div>You didn't get it (it was {secret.value.thing})</div>;
}
