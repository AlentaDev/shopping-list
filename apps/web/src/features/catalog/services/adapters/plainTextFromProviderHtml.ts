const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

type ParsedTag = {
  name: string | undefined;
  closing: boolean;
  end: number;
};

const readTag = (value: string, start: number): ParsedTag | null => {
  const end = value.indexOf(">", start + 1);
  if (end < 0) return null;
  const contents = value.slice(start + 1, end).trim();
  const closing = contents.startsWith("/");
  const name = contents.replace(/^\/?\s*/, "").match(/^[a-z][a-z\d-]*/i)?.[0]?.toLowerCase();
  return { name, closing, end };
};

const isBlockElement = (name: string | undefined): boolean =>
  name === "p" || name === "div" || name === "br" || name === "li" ||
  name === "ul" || name === "ol" || name === "tr" || name === "td" ||
  name === "th" || Boolean(name && /^h[1-6]$/.test(name));

const skipElementContent = (value: string, tagName: string, tagEnd: number): number => {
  const closingStart = value.toLowerCase().indexOf(`</${tagName}`, tagEnd + 1);
  if (closingStart < 0) return value.length;
  const closingEnd = value.indexOf(">", closingStart + 2 + tagName.length);
  return closingEnd < 0 ? value.length : closingEnd + 1;
};

const readEntity = (value: string, start: number): { text: string; next: number } | null => {
  const end = value.indexOf(";", start + 1);
  if (end <= start || end - start > 32) return null;
  const body = value.slice(start + 1, end);
  if (!/^(?:#(?:x[\da-f]+|\d+)|[a-z][\da-z]+)$/i.test(body)) return null;

  if (body[0] === "#") {
    const hex = body[1]?.toLowerCase() === "x";
    const codePoint = Number.parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
    const text = Number.isInteger(codePoint) && codePoint > 0 && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : " ";
    return { text, next: end + 1 };
  }
  return { text: HTML_ENTITIES[body.toLowerCase()] ?? " ", next: end + 1 };
};

const readMarkup = (value: string, index: number): { text: string; next: number } | null => {
  if (value[index] === "<") {
    const tag = readTag(value, index);
    if (!tag) return { text: value.slice(index), next: value.length };
    if (!tag.closing && (tag.name === "script" || tag.name === "style")) {
      return { text: " ", next: skipElementContent(value, tag.name, tag.end) };
    }
    return { text: isBlockElement(tag.name) ? " " : "", next: tag.end + 1 };
  }
  if (value[index] === "&") {
    const entity = readEntity(value, index);
    if (entity) return entity;
  }
  return null;
};

const normalizeWhitespace = (value: string): string => {
  let normalized = "";
  let hasPendingSpace = false;
  for (const character of value) {
    if (/\s/.test(character)) {
      hasPendingSpace = true;
      continue;
    }
    if (hasPendingSpace && !",.;:!?".includes(character) && normalized) {
      normalized += " ";
    }
    normalized += character;
    hasPendingSpace = false;
  }
  return normalized.trim();
};

/** Converts untrusted provider markup to display text without interpreting it as HTML. */
export const plainTextFromProviderHtml = (value: string): string => {
  let text = "";
  let index = 0;

  while (index < value.length) {
    const markup = readMarkup(value, index);
    if (markup) {
      text += markup.text;
      index = markup.next;
    } else {
      text += value[index];
      index += 1;
    }
  }

  return normalizeWhitespace(text);
};
