/* Parses a string that has <tag attrs...>...</tag>, but not nested and
   permissive */

export function parseTags(s) {
  const parts = [];
  do {
    const nextMatch = s.match(/<([^/][^>]+)>/);
    if (!nextMatch) {
      if (!parts.length) {
        parts.push({ type: "comment", content: trimClosing(s) });
      } else {
        parts[parts.length - 1].content += trimClosing(s);
      }
      break;
    }
    const leading = trimClosing(s.slice(0, nextMatch.index));
    if (leading) {
      if (!parts.length) {
        parts.push({ type: "comment", content: leading });
      } else {
        parts[parts.length - 1].content += leading;
      }
    }
    const [tag, attrs] = parseAttrs(nextMatch[1]);
    parts.push({ type: tag, ...attrs, content: "" });
    s = s.slice(nextMatch.index + nextMatch[0].length);
  } while (s.trim());
  return parts;
}

function trimClosing(s) {
  return s.trim().replace(/<\/[^>]+>$/, "").trim();
}

function parseAttrs(s) {
  const [tag, attrsText] = s.split(/\s+/, 2);
  const attrs = {};
  if (attrsText) {
    Array.from(attrsText.matchAll(/([^=]+)="([^"]*)"/g)).forEach((match) => {
      attrs[match[1].trim()] = match[2];
    });
  }
  return [tag, attrs];
}

export function serializeTags(tags) {
  const lines = [];
  for (const tag of tags) {
    const attrs = Object.assign({}, tag);
    delete attrs.type;
    delete attrs.content;
    lines.push(`<${tag.type}${serializeAttrs(attrs)}>`);
    lines.push(tag.content || "");
    lines.push(`</${tag.type}>\n`);
  }
  return lines.join("\n");
}

function serializeAttrs(attrs) {
  const result = [];
  for (const [key, value] of Object.entries(attrs)) {
    result.push(` ${key}="${value}"`);
  }
  return result.join("");
}
