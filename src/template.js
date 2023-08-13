let _id = 0;
function nextIdentifier() {
  _id++;
  return "${placeholder-" + _id + "}";
}

export function tmpl(strings, ...args) {
  const props = new Map();
  let parts = [];
  for (let i = 0; i < strings.length - 1; i++) {
    parts.push(strings[i]);
    const id = nextIdentifier();
    props.set(id, args[i]);
    parts.push(id);
  }
  parts.push(strings[strings.length - 1]);
  const template = parts.join("");
  return parseTemplate(dedent(template), props);
}

export function fillTemplate(template, evaluator) {
  const props = new Map();
  const parts = [];
  const subs = [];
  let match;
  let regex = /\{\{(.*?)\}\}/g;
  let pos = 0;
  while ((match = regex.exec(template))) {
    parts.push(template.slice(pos, match.index));
    subs.push(evaluator(match[1]));
    pos = match.index + match[0].length;
  }
  parts.push(template.slice(pos));
  return tmpl(parts, ...subs);
}

function parseTemplate(template, props) {
  const tailingPunctuationMatcher = /(\$\{placeholder-\d+\})([.,])/g;
  let match;
  template = template.replace(tailingPunctuationMatcher, (match, name, punctuation) => {
    const value = props.get(name);
    if (value && typeof value === "string" && /[!;,\.\?]$/.test(value)) {
      return name;
    }
    return name + punctuation;
  });
  const markdownListMatcher = /^(\s*)(\d+\.|\*|\-)\s+\.\.\.(\$\{placeholder-\d+\})/gm;
  template = template.replace(markdownListMatcher, (match, indent, bullet, name) => {
    const value = props.get(name);
    if (!value) {
      return indent + bullet + " " + "[No value]";
    }
    if (!Array.isArray(value)) {
      return indent + bullet + " " + name + " [Not a list]";
    }
    const filtered = value.filter((v) => !isEmpty(v));
    if (filtered.length === 0) {
      return indent + bullet + " " + "[No values]";
    }
    const numMatch = /^(\d)+/.exec(bullet);
    let num = -1;
    if (numMatch) {
      num = parseInt(numMatch[1], 10);
    }
    const newId = nextIdentifier();
    props.set(newId, filtered.map((v, i) => {
      if (num !== -1) {
        return indent + (num + i) + ". " + repr(v);
      }
      return indent + bullet + " " + repr(v);
    }).join("\n"));
    return newId;
  });
  const conditionalMatcher = /\[\[([^]*?)\]\]/g;
  template = template.replace(conditionalMatcher, (match, inner) => {
    let found = false;
    let hasEmpty = false;
    const repl = inner.replace(/(\$\{placeholder-\d+\})/g, (varMatch, name) => {
      const value = props.get(name);
      if (isEmpty(value)) {
        hasEmpty = true;
      }
      found = true;
      return match;
    });
    if (!found) {
      // No variables found anywhere
      console.warn("No variables found in conditional", match);
      return match;
    }
    if (hasEmpty) {
      // One of the variables is empty
      return "";
    }
    return inner;
  });
  return substituteTemplate(template, props);
}

function substituteTemplate(template, props) {
  let result = template;
  for (const key of props.keys()) {
    result = result.replace(key, () => repr(props.get(key)));
  }
  result = result.replace(/\n\n\n+/g, "\n\n");
  result = result.trim();
  return result;
}

export function isEmpty(v) {
  return (
    v === null ||
    v === undefined ||
    v === "" ||
    (Array.isArray(v) && v.length === 0)
  );
}

export function repr(v) {
  if (v === null || v === undefined) {
    return "[No value]";
  }
  if (typeof v === "string") {
    return v;
  }
  if (Array.isArray(v)) {
    return v.map(x => repr(x)).join(", ");
  }
  if ((v + "") === "[object Object]") {
    return JSON.stringify(v);
  }
  return v + "";
}

export function dedent(template) {
  if (template === null || template === undefined) {
    throw new Error("Template is null or undefined");
  }
  const lines = template.split("\n");
  let firstLine = lines[0];
  if (firstLine.trim() === "") {
    firstLine = "";
  } else {
    firstLine = `${firstLine.trimEnd()}\n`;
  }
  lines.shift();
  while (lines.length && lines[0].trim() === "") {
    lines.shift();
  }
  while (lines.length && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }
  let indent = -1;
  for (const indentLine of lines) {
    const trimmed = indentLine.trimStart();
    if (trimmed) {
      const newIndent = indentLine.length - trimmed.length;
      if (indent === -1 || newIndent < indent) {
        indent = newIndent;
      }
    }
  }
  const result = lines.map((line) => line.slice(indent).trimEnd()).join("\n");
  return `${firstLine}${result}`;
}
