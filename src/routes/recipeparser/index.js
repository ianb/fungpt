import { GPT } from "../../gpt";
import { tmpl, dedent } from "../../template";
import { getResult } from "../../components/callback";
import { signal } from "@preact/signals";
import { TextArea, Button, H1 } from "../../components/input";
import { Page } from "../../components/page";
import { useEffect } from "preact/hooks";
import { Markdown } from "../../markdown";

const gpt = new GPT();
const recipeInput = signal("");
const structuredRecipe = signal(null);
const Interaction = signal();

const RecipeParser = ({ }) => {
  useEffect(() => {
    recipeParser();
  }, []);
  return <Page title="Recipe Librarian">
    <Recipe recipe={structuredRecipe} />
    {Interaction.value || <div>Loading...</div>}
    <gpt.Log />
  </Page>;
};

export default RecipeParser;

async function recipeParser() {
  while (true) {
    let content = await getResult(Interaction, <div>
      <Button returns={{ action: "generate" }}>Generate</Button>
      <TextArea label="Raw recipe:" signal={recipeInput} />
    </div>);
    if (content.action === "generate") {
      const recipeParsed = await gpt.chat({
        messages: [
          {
            role: "system", content: tmpl`
            You are a recipe librarian. You take recipes and put them into easy, structured formats.

            The recipe structure is a JSON structure like:

            {
              name: "Smoked salmon pasta",
              description: "A delicious pasta dish with smoked salmon",
              servings: 4,
              preparationTime: "30 minutes",
              cookingTime: "10 minutes",
              [
                {
                  section: "Prepare the sauce",
                  incredients: [
                    {
                      description: "1 cup of tomato sauce",
                      quantity: 1,
                      unit: "cup",
                      item: "tomato sauce"
                    },
                  ],
                  directions: "Add the tomato sauce to a saucepan and heat over medium heat."
                }
              ]
            }
            `},
          {
            role: "user", content: tmpl`
            Take this recipe and turn it into the JSON structure:

            """
            ${recipeInput.value}
            """

            JSON:
            `},
        ]
      });
      let json;
      try {
        json = recipeParsed.parsed;
      } catch (e) {
        json = gpt.fixJsonWithGpt(recipeParsed);
      }
      structuredRecipe.value = json;
    }
  }
}

const Recipe = ({ recipe }) => {
  if (!recipe.value) {
    return <div>Loading...</div>;
  }
  return <div>
    <pre class="whitespace-pre-wrap text-xs">{JSON.stringify(recipe.value, null, 2)}</pre>
  </div>;
};
