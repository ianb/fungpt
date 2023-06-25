import { useState } from "preact/hooks";
import { Button } from "./input";
import { twMerge } from "tailwind-merge";
import * as icons from "./icons";

const GETIMG_API_KEY = localStorage.getItem("GETIMG_API_KEY");

export function hasKey() {
  return !!GETIMG_API_KEY;
}

export async function saveImage({
  title,
  metadata,
  project,
  image,
}) {
  const resp = await fetch("/images/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      metadata,
      project,
      image,
    }),
  });
  if (!resp.ok) {
    console.warn("Failed to save image", resp);
    throw new Error("Failed to save image");
  }
  const json = await resp.json();
  return json;
}

export const imagePromptDefaults = {
  // Realistic, most normal?
  // model: "realistic-vision-v1-3",
  // Main anime:
  // model: "eimis-anime-diffusion-v1-0",
  // Modern disney:
  // model: "mo-di-diffusion",
  // Something (anime):
  model: "something-v2-2",
  // ICBINP (photo):
  // model: "icbinp",
  // Neverending dream (detailed anime):
  // model: "neverending-dream",
  // OpenJourney:
  // model: "openjourney-v1-0",
  // Stable Diffusion v2.1:
  // model: "stable-diffusion-v2-1",

  negative_prompt: "Disfigured, cartoon, blurry",
  width: 512,
  height: 512,
  steps: 25,
  guidance: 7.5,
  scheduler: "dpmsolver++",
  output_format: "jpeg",
}

export async function generateImage(props) {
  if (!hasKey()) {
    throw new Error("No GETIMG_API_KEY");
  }
  if (!props.project) {
    throw new Error("No .project in props");
  }
  const promptBody = Object.assign({}, imagePromptDefaults, filterKeys(props, ["prompt", "model", "negative_prompt", "width", "height", "steps", "guidance", "scheduler", "output_format"]));
  console.info("getimg prompt:", promptBody)
  // /getimg goes to https://api.getimg.ai
  const resp = await fetch("/getimg/v1/stable-diffusion/text-to-image", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GETIMG_API_KEY}`,
    },
    body: JSON.stringify(promptBody),
  });
  const json = await resp.json();
  console.log("Completed with response:", json);
  if (!resp.ok) {
    console.warn("Failed to generate image", promptBody, resp, json);
    throw new Error("Failed to generate image");
  }
  const { image, seed } = json;
  const metadata = Object.assign({}, promptBody, props, { seed });
  const img = await saveImage({
    title: props.prompt,
    metadata,
    project: props.project,
    image,
  });
  return { ...metadata, ...img };
}

function filterKeys(obj, keys) {
  const result = {};
  for (const key of keys) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

export const GenerativeImage = ({ metadata, file, onSave, onRemove, ifKey, class: className, ...props }) => {
  const [generating, setGenerating] = useState(false);
  if (ifKey && !hasKey()) {
    console.log("No GETIMG_API_KEY");
    return null;
  }
  const onGenerate = async () => {
    setGenerating(true);
    const img = await generateImage(metadata);
    await onSave(img);
    setGenerating(false);
  };
  const onDelete = async () => {
    await onRemove();
  };
  const onRefresh = async () => {
    await onGenerate();
  };
  className = twMerge("border border-black rounded mt-2", className);
  return <div class={className} {...props}>
    {file && file.url ? (
      <div class="relative group">
        <div class="absolute top-0 right-0 hidden group-hover:block">
          <button onClick={onRefresh}><icons.Refresh class="h-3 w-3 text-white hover:text-blue-300" /></button>
          <button onClick={onDelete}><icons.Trash class="h-3 w-3 text-white hover:text-blue-300" /></button>
        </div>
        <img src={file.url} title={metadata.prompt} />
      </div>
    ) : (
      <div class="h-full">
        <div>
          {generating ? (
            <div>
              Generating...
            </div>
          ) : (
            <div class="flex justify-center">
              <Button onClick={onGenerate}>Generate</Button>
            </div>
          )}
        </div>
        <div class="text-xs p-2">{metadata.prompt}</div>
      </div>
    )}
  </div >;
};
