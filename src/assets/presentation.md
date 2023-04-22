## Building with GPT

<div class="flex">
<div class="mx-auto max-w-1/2">
<h3>Building Fun Things With GPT</h3>
Ian Bicking <br />
April 22, 2023 <br />
Minnebar 17
</div>
</div>

## What this talk is not

I will not:

* Prognosticate about the future and GPT's impact
* Build on anxieties about being left behind
* Worry about the inside of GPT
* Discuss any libraries or frameworks

## GPT: a fun, tasty snack

The GPT API is **VERY EASY TO USE**

```sh
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "system", "content": "be surly"},
      {"role": "user", "content": "hi there!"}
    ]
  }'
```

## How GPT works (from the **outside**)

1. You give GPT a **prompt**
2. GPT **completes the prompt**

Input -> Output

## So what's a prompt?

Before the ChatGPT API: a prompt was *text to be completed*:

<img src="/assets/presentation/platground-gpt3.png" />

## ChatGPT prompts

Now with the ChatGPT API: a prompt is a *conversation to be completed*:

<img src="assets/presentation/playground-chat.png" />

## Still prompts

Before:

```json
{
  "prompt": "This is a conversation ... Human: What is the size of the Earth?\nAI:"
}
```

Now:

```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful AI assistant"},
    {"role": "user", "content": "What is the size of the Earth?"}
  ]
}
```

## Instruction-following machine

GPT is acting as an _instruction-following machine_ more than a completer.

**The API is hiding nothing**

1. GPT has no memory
2. GPT does not know you
3. GPT is not personalized
4. GPT never learns
5. The GPT API won't even use your prompts for training

## Anatomy of a chat prompt

The request is one JSON object:

```json
{
  "messages": [
    {"role": "system", "content": "General instructions for GPT"},
    {"role": "user", "content": "A user request, direct command"}
  ],
  ... other less important properties ...
}
```

## When the chat goes longer...

```json
{
  "messages": [
    {"role": "system", "content": "Be a boring and uninterested assistant"},
    {"role": "user", "content": "my name is Ian"},
    {"role": "assistant", "content": "hi Ian"},
    {"role": "user", "content": "tell me a limerick with my name"}
  ],
}
```

## Looks like a chat, but really it's whatever you want

The messages _do not_ have to represent an accurate history or any history at all

The user doesn't have to write what goes in `{"role": "user", "content": "..."}`

## system vs user messages

The `{"role": "system"}` message is _instructions from the system to ChatGPT_.

The `{"role": "user"}` message is _instructions from the user_.

Closer to social cues than firm rules. "user" is more powerful and immediate!

```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful AI assistant"},
    {"role": "user", "content": "What is the size of the Earth?"}
  ]
}
```

## Back to chat

Implementing the obvious

[/chat](http://localhost:8082/chat)

## The Playground

https://platform.openai.com/playground?mode=chat

## Extending chat

There's no "end" to AI conversations. But we can make an end!

[/chat2](http://localhost:8082/chat2)

## Or change the input

Uncontrolled input from the user can lead to distraction or abuse. So: rewrite it first!

[/chat3](http://localhost:8082/chat3)

Note the translation of the user prompt!

## Put GPT on both sides

[/selfchat](http://localhost:8082/selfchat)

History belongs to you!

## GPT 3.5 vs 4

GPT 3.5 is:

1. Publicly available to everyone
2. Fast
3. Much cheaper (10-30x, even 60x!)
4. Pretty good!

GPT 4 is:

1. Much slower
2. More expensive
3. Better at listening to _all_ your instructions
4. Much better at math and logical reasoning

## Algebra tutor

[/algebratutor](http://localhost:8082/algebratutor)

Where GPT-4 shines!

## 20 Questions: remembering & keeping secrets

[/twentyquestions](http://localhost:8082/twentyquestions)

(See [json5.org](https://json5.org/) for parsing)

## Terrible dice rolls

Rolls terrible dice...

<img class="m-auto" style="height: 60vh" src="/assets/presentation/dice-rolls-tweet.png" />

## Eliciting expansive ideas

Temperature is _okay_. Lists are _much better_.

**"Create a list of 10 different person, places, or things"**

Response:
> 1. Eiffel Tower
> 2. Mona Lisa painting
> 3. Beyoncé
> 4. Great Barrier Reef
> 5. Statue of Liberty
> 6. Mount Everest
> 7. Harry Potter book series
> 8. Grand Canyon
> 9. The Beatles
> 10. Taj Mahal


## Lots and lots of ideas...

[llm.ianbicking.org/layercraft/](https://llm.ianbicking.org/layercraft/)

GPT comes up with ideas, humans adjust and choose ideas

## Prompt engineering

_You_ have tremendous influence with how you write your prompts.

For city background this is a pretty good instruction:

```
* The culture flavor and culture context of the city
```

This isn't:

```
* The social structure of the city, such as caste system
  or class system, unusual family structures
```

I DON'T EVEN KNOW WHY!

## Condensing context

Turning a character description into a chat prompt or an image prompt...

## Parsing

[/recipeparser](http://localhost:8082/recipeparser)

([Example recipe](https://www.allrecipes.com/recipe/20144/banana-banana-bread/))

You can have GPT generate natural language _then_ parse it!

## Using natural language as canonical data

[/roleplaygame](http://localhost:8082/roleplaygame)

## Socially appropriate?

**Without** asking if something is socially appropriate:

> You approach Zephyr from behind and give him a light tickle on his side. He jumps in surprise and turns around, his face breaking into a laugh. 'Hey there, stranger! What can I do for you?' he asks with a grin.
>
> +1 fondness towards Asher. He appreciates the lighthearted moment amidst the serious work.

**With** socially appropriate:

> As you try to tickle Zephyr, he stops hammering and turns to you with a look of annoyance. 'What do you think you're doing?' he growls, clearly not amused by your attempt at humor

## Check back on the images

...

## Mult-step

[/slidemaker](http://localhost:8082/slidemaker)

GPT provides the user with _options_ over multiple steps

## What do you bring?

For some domain:

1. You bring your _engagement_
2. You bring your _taste_

I hope you all are part of making this technology real in the world.

## Follow up

* https://ianbicking.org
* https://hachyderm.io/@ianbicking
* https://twitter.com/ianbicking
* https://
