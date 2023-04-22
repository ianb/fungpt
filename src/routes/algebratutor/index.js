import { GPT } from "../../gpt";
import { tmpl, dedent } from "../../template";
import { getResult } from "../../components/callback";
import { signal } from "@preact/signals";
import { persistentSignal } from "../../persistentsignal";
import { TextInput, H1, Button } from "../../components/input";
import { Page } from "../../components/page";
import { Markdown } from "../../markdown";

const gpt = new GPT();
const problem = persistentSignal("algebratutor.problem", null);
const steps = persistentSignal("algebratutor.steps", null);
const Interaction = signal();

const AlgebraTutor = ({ }) => {
  return <Page title="Algebra Tutor" start={algebraTutor}>
    <AlgebraLog problem={problem} steps={steps} />
    {Interaction.value || <div>Loading...</div>}
    <gpt.Log />
  </Page>;
};

export default AlgebraTutor;

const AlgebraLog = ({ problem, steps }) => {
  if (!problem.value || !steps.value) {
    return <div>Loading...</div>;
  }
  return <div>
    <div>Problem:
      <Markdown text={problem.value} class="pl-6" />
    </div>
    <div>Steps: <Markdown text={steps.value} /></div>
  </div>;
};

/**** LOGIC LOOP ****/

async function algebraTutor() {
  while (true) {
    let action = await getResult(Interaction, <div>
      <Button returns={{ action: "regen" }}>Regenerate</Button>
    </div>);
    if (action.action === "regen") {
      problem.value = steps.value = null;
      const prob = await gpt.chat({
        messages: [
          { role: "system", content: "You are an algebra tutor. Express all your equations in LaTex using $x$" },
          {
            role: "user", content: dedent(`
            Come up with a single-variable equation that could be simplified.

            Example:

            $\\frac{3x^2}{2x} + 5x$

            Respond with only an equation that requires simplification
            `)
          },
        ]
      });
      problem.value = prob.content;
      const stepsResponse = await gpt.chat({
        messages: [
          { role: "system", content: "You are an algebra tutor. Express all your equations in LaTex using $x$" },
          {
            role: "user", content: tmpl`
            Write a series of steps to simplify the equation: ${prob.content}

            Example for $\\frac{3x^2}{2x} + 5x$
            1. Divide the numerator and denominator by $x$
            2. The result is $\\frac{3x}{2} + 5$
            3. Divide the numerator and denominator by $2$
            4. The result is $\\frac{3}{2}x + 5$
            5. Simplify the result
            6. The result is $\\frac{13}{2}x$

            Respond with a list of steps for ${prob.content}
            `
          },
        ]
      });
      steps.value = stepsResponse.content;
    }
  }
}
