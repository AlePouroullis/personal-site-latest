import { Fragment, type ReactNode } from "react";

// Inline markdown for prose kept in JSON manifests (collection intro/outro):
// **bold**, *italic*, `code`, [label](url), and backslash escapes, nested
// freely. Block syntax is deliberately absent — paragraphs come from blank
// lines, and the manifests have no use for headings or lists.

type Token =
  | { t: "text"; v: string }
  | { t: "code"; v: string }
  | { t: "em" | "strong"; c: Token[] }
  | { t: "link"; href: string; c: Token[] };

const ESCAPABLE = /[\\`*_[\]()]/;
const WORD = /[\p{L}\p{N}]/u;

interface LinkMatch {
  label: string;
  href: string;
  end: number;
}

function matchLink(src: string, at: number): LinkMatch | null {
  if (src[at] !== "[") return null;
  let depth = 1;
  let i = at + 1;
  for (; i < src.length && depth > 0; i++) {
    const c = src[i];
    if (c === "\\") i++;
    else if (c === "[") depth++;
    else if (c === "]") depth--;
  }
  if (depth !== 0 || src[i] !== "(") return null;
  const label = src.slice(at + 1, i - 1);

  let paren = 1;
  let j = i + 1;
  for (; j < src.length && paren > 0; j++) {
    const c = src[j];
    if (c === "\\") j++;
    else if (c === "(") paren++;
    else if (c === ")") paren--;
  }
  if (paren !== 0) return null;
  const href = src.slice(i + 1, j - 1).trim();
  if (!href || /\s/.test(href)) return null;
  return { label, href, end: j };
}

// Locate the delimiter run that closes an emphasis span, stepping over code
// spans, links, and escapes so their contents can't close it by accident.
function findClose(src: string, from: number, ch: string, len: number): number {
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (c === "\\") {
      i++;
      continue;
    }
    if (c === "`") {
      const end = src.indexOf("`", i + 1);
      if (end !== -1) {
        i = end;
        continue;
      }
    }
    if (c === "[") {
      const link = matchLink(src, i);
      if (link) {
        i = link.end - 1;
        continue;
      }
    }
    if (c !== ch) continue;

    let run = 1;
    while (src[i + run] === ch) run++;
    // A `**` run belongs to a nested strong span, not to single-char emphasis.
    const wrongLength = run < len || (len === 1 && run >= 2);
    const spaceBefore = /\s/.test(src[i - 1] ?? " ");
    const gluedWord = ch === "_" && WORD.test(src[i + run] ?? "");
    if (wrongLength || spaceBefore || gluedWord) {
      i += run - 1;
      continue;
    }
    return i;
  }
  return -1;
}

function parse(src: string): Token[] {
  const out: Token[] = [];
  let buf = "";
  const flush = () => {
    if (buf) {
      out.push({ t: "text", v: buf });
      buf = "";
    }
  };

  let i = 0;
  while (i < src.length) {
    const c = src[i];

    if (c === "\\" && ESCAPABLE.test(src[i + 1] ?? "")) {
      buf += src[i + 1];
      i += 2;
      continue;
    }

    if (c === "`") {
      const end = src.indexOf("`", i + 1);
      if (end > i + 1) {
        flush();
        out.push({ t: "code", v: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    if (c === "[") {
      const link = matchLink(src, i);
      if (link) {
        flush();
        out.push({ t: "link", href: link.href, c: parse(link.label) });
        i = link.end;
        continue;
      }
    }

    if (c === "*" || c === "_") {
      const len = src[i + 1] === c ? 2 : 1;
      // An opener hugs the word it emphasises, and `_` never splits a word —
      // so `2 * 3` and `IMG_9452_x` stay literal.
      const opens =
        !/\s/.test(src[i + len] ?? " ") &&
        (c !== "_" || !WORD.test(src[i - 1] ?? ""));
      if (opens) {
        const close = findClose(src, i + len, c, len);
        if (close > i + len) {
          flush();
          out.push({
            t: len === 2 ? "strong" : "em",
            c: parse(src.slice(i + len, close)),
          });
          i = close + len;
          continue;
        }
      }
    }

    buf += c;
    i++;
  }
  flush();
  return out;
}

const isExternal = (href: string) => /^(https?:\/\/|mailto:)/.test(href);

function render(tokens: Token[], noLinks: boolean): ReactNode[] {
  return tokens.map((tok, i) => {
    switch (tok.t) {
      case "text":
        return <Fragment key={i}>{tok.v}</Fragment>;
      case "code":
        return <code key={i}>{tok.v}</code>;
      case "em":
        return <em key={i}>{render(tok.c, noLinks)}</em>;
      case "strong":
        return <strong key={i}>{render(tok.c, noLinks)}</strong>;
      case "link":
        return noLinks ? (
          <Fragment key={i}>{render(tok.c, noLinks)}</Fragment>
        ) : (
          <a
            key={i}
            href={tok.href}
            {...(isExternal(tok.href)
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {render(tok.c, noLinks)}
          </a>
        );
    }
  });
}

function toPlain(tokens: Token[]): string {
  return tokens
    .map((tok) =>
      tok.t === "text" || tok.t === "code" ? tok.v : toPlain(tok.c),
    )
    .join("");
}

// For places that need the prose without markup: meta descriptions, alt text.
export function stripMarkdown(text: string): string {
  return toPlain(parse(text));
}

export default function InlineMarkdown({
  text,
  noLinks = false,
}: {
  text: string;
  // Set where the text already sits inside an anchor — nested links are
  // invalid HTML, so links degrade to their label.
  noLinks?: boolean;
}) {
  return <>{render(parse(text), noLinks)}</>;
}
