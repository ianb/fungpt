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
  const tagMatch = s.match(/^([^\s]+)\s+(.*)$/);
  if (!tagMatch) {
    return [s, {}];
  }
  const tag = tagMatch[1];
  const attrsText = tagMatch[2];
  const attrs = {};
  if (attrsText) {
    Array.from(attrsText.matchAll(/([^=\s]+)="([^"]*)"/g)).forEach((match) => {
      attrs[match[1].trim()] = match[2];
    });
  }
  return [tag, attrs];
}

export function serializeTags(tags, omit = null) {
  const lines = [];
  for (const tag of tags) {
    const attrs = Object.assign({}, tag);
    delete attrs.type;
    delete attrs.content;
    lines.push(`<${tag.type}${serializeAttrs(attrs, omit)}>`);
    lines.push(tag.content || "");
    lines.push(`</${tag.type}>\n`);
  }
  return lines.join("\n");
}

function serializeAttrs(attrs, omit = null) {
  const result = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (omit && Array.isArray(omit) && omit.includes(key)) {
      continue;
    }
    if (omit && typeof omit === "function" && omit(key, value)) {
      continue;
    }
    if (omit && typeof omit === "string" && key === omit) {
      continue;
    }
    result.push(` ${key}="${value}"`);
  }
  return result.join("");
}
