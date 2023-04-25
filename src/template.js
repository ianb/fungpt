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
  const markdownListMatcher = /^(\s*)(\d+\.|\*|\-)\s+\.\.\.(\$\{placeholder-\d+\})/g;
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
    }));
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

function isEmpty(v) {
  return (
    v === null ||
    v === undefined ||
    v === "" ||
    (Array.isArray(v) && v.length === 0)
  );
}

function repr(v) {
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
  template = template.trim();
  let lines = template.split("\n");
  const firstLine = lines[0];
  lines = lines.slice(1);
  let indent = -1;
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (trimmed) {
      const newIndent = line.length - trimmed.length;
      if (indent === -1 || newIndent < indent) {
        indent = newIndent;
      }
    }
  }
  const result = lines
    .map((line) => line.slice(indent))
    .join("\n");
  return firstLine + "\n" + result;
}
