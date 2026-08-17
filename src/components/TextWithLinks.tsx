import { Fragment } from "react";

// Renders plain text with markdown-style [label](url) links as anchors.
export default function TextWithLinks({ text }: { text: string }) {
  const parts = text.split(/\[([^\]]+)\]\(([^)\s]+)\)/g);
  return (
    <>
      {parts.map((part, i) => {
        // split() yields [text, label, url, text, label, url, ...]
        if (i % 3 === 1) {
          const url = parts[i + 1];
          const external = /^https?:\/\//.test(url);
          return (
            <a
              key={i}
              href={url}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {part}
            </a>
          );
        }
        if (i % 3 === 2) return null;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
