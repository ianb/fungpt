import { h } from "preact";
import { marked } from "marked";
import hljs from "highlight.js";
import Katex from "katex";
import extendedLatex from "marked-extended-latex";


// See: https://marked.js.org/using_advanced
marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  breaks: true, // Makes line breaks into <br />
  headerIds: true,
  highlight: function (code, lang) {
    console.log("highlight", code, lang);
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    console.log("result", hljs.highlight(code, { language }).value);
    const html = hljs.highlight(code, { language }).value;
    return `<div class="hljs py-1 px-2">${html}</div>`;
  },
});
marked.use(extendedLatex({
  render: (formula, displayMode) => {
    let result;
    try {
      result = Katex.renderToString(formula, { displayMode });
    } catch (e) {
      console.error("Error rendering LaTeX in equation:", formula, e);
      return `<code class="text-red-800">${formula}</code>`;
    }
    return `<code>${result}</code>`;
  }
}));

export function parseHtml(html, wrap = true) {
  const p = new DOMParser();
  if (wrap) {
    html = `<div>${html}</div>`;
  }
  const doc = p.parseFromString(html, "text/html");
  const el = doc.body.childNodes[0];
  return el;
}

export function elementToPreact(element, callback) {
  const tag = element.tagName.toLowerCase();
  const attrs = {};
  for (const attr of element.attributes) {
    attrs[attr.name] = attr.value;
  }
  const children = [];
  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      children.push(child.textContent);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      children.push(elementToPreact(child, callback));
    }
  }
  let repl = null;
  if (callback) {
    repl = callback(element, tag, attrs, children);
  }
  if (repl === "") {
    repl = null;
  } else if (!repl) {
    repl = h(tag, attrs, children);
  }
  return repl;
}

export function markdownToElement(markdown) {
  const rendered = marked.parse(markdown);
  const el = parseHtml(rendered);
  return el;
}

export function markdownToPreact(markdown) {
  const el = markdownToElement(markdown);
  return elementToPreact(el);
}

export function Markdown(props) {
  const text = props.text;
  if (!text) {
    return null;
  }
  if (typeof text !== "string") {
    console.warn("<Markdown> received non-string text:", text);
  }
  const otherProps = { ...props };
  delete otherProps.text;
  otherProps.class = (otherProps.class || "") + " unreset";
  return <div {...otherProps}>{markdownToPreact(text)}</div>;
}
