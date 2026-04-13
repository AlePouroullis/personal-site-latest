"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { Photo } from "@/lib/photos";

interface Item {
  file: string;
  caption: string;
  included: boolean;
  src: string;
}

export default function PhotoEditor({ photos }: { photos: Photo[] }) {
  const [items, setItems] = useState<Item[]>(() =>
    photos.map((p) => ({
      file: p.src.split("/").pop()!,
      caption: p.caption ?? "",
      included: true,
      src: p.src,
    })),
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const anchorRef = useRef<string | null>(null);
  const dragSetRef = useRef<Set<string> | null>(null);
  const [copied, setCopied] = useState(false);

  const indexOf = (file: string) => items.findIndex((x) => x.file === file);

  const handleSelect = (file: string, e: React.MouseEvent) => {
    const i = indexOf(file);
    if (e.shiftKey && anchorRef.current) {
      const a = indexOf(anchorRef.current);
      const [lo, hi] = a < i ? [a, i] : [i, a];
      const range = new Set(items.slice(lo, hi + 1).map((x) => x.file));
      setSelected((prev) =>
        e.metaKey || e.ctrlKey ? new Set([...prev, ...range]) : range,
      );
    } else if (e.metaKey || e.ctrlKey) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(file)) next.delete(file);
        else next.add(file);
        return next;
      });
      anchorRef.current = file;
    } else {
      setSelected(new Set([file]));
      anchorRef.current = file;
    }
  };

  const handleDragStart = (file: string) => {
    dragSetRef.current = selected.has(file) ? selected : new Set([file]);
    if (!selected.has(file)) setSelected(new Set([file]));
  };

  const handleDrop = (targetFile: string) => {
    const moving = dragSetRef.current;
    dragSetRef.current = null;
    if (!moving || moving.size === 0) return;
    setItems((prev) => {
      const movingItems = prev.filter((x) => moving.has(x.file));
      const remaining = prev.filter((x) => !moving.has(x.file));
      let insertAt = remaining.findIndex((x) => x.file === targetFile);
      if (insertAt === -1) insertAt = remaining.length;
      remaining.splice(insertAt, 0, ...movingItems);
      return remaining;
    });
  };

  const json = useMemo(() => {
    const out = items
      .filter((i) => i.included)
      .map((i) =>
        i.caption ? { file: i.file, caption: i.caption } : { file: i.file },
      );
    return JSON.stringify(out, null, 2);
  }, [items]);

  const includedCount = items.filter((i) => i.included).length;

  return (
    <div className="space-y-6">
      <div
        className="text-sm flex items-center justify-between gap-4"
        style={{ color: "var(--text-muted)" }}
      >
        <span>
          {includedCount} of {items.length} included
          {selected.size > 0 && (
            <>
              {" · "}
              <strong>{selected.size} selected</strong>{" "}
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="cursor-pointer underline"
              >
                clear
              </button>
            </>
          )}
        </span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(json);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="cursor-pointer underline shrink-0"
          style={{ color: "var(--link-color)" }}
        >
          {copied ? "copied ✓" : "copy photos JSON"}
        </button>
      </div>

      <p className="text-xs" style={{ color: "var(--text-light)" }}>
        click to select · shift+click for range · ⌘/ctrl+click to toggle · drag
        to move selection
      </p>

      <ol className="space-y-2">
        {items.map((item, i) => {
          const isSelected = selected.has(item.file);
          return (
            <li
              key={item.file}
              draggable
              onDragStart={() => handleDragStart(item.file)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(item.file)}
              onClick={(e) => handleSelect(item.file, e)}
              className="flex items-center gap-3 p-2 cursor-move select-none"
              style={{
                background: isSelected
                  ? "color-mix(in srgb, var(--link-underline) 12%, var(--bg-primary))"
                  : "var(--bg-primary)",
                border: `1px solid ${
                  isSelected ? "var(--link-underline)" : "var(--border-color)"
                }`,
                opacity: item.included ? 1 : 0.4,
              }}
            >
              <span
                className="text-xs w-6 text-right shrink-0"
                style={{ color: "var(--text-light)" }}
              >
                {item.included
                  ? items.slice(0, i + 1).filter((x) => x.included).length
                  : "—"}
              </span>
              <input
                type="checkbox"
                checked={item.included}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((x, j) =>
                      j === i ? { ...x, included: e.target.checked } : x,
                    ),
                  )
                }
                onClick={(e) => e.stopPropagation()}
                className="cursor-pointer shrink-0"
                aria-label={`Include ${item.file}`}
              />
              <div className="relative w-24 h-16 shrink-0 overflow-hidden">
                <Image
                  src={item.src}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-xs font-mono truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.file}
                </div>
                <input
                  type="text"
                  value={item.caption}
                  placeholder="caption (optional)"
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, caption: e.target.value } : x,
                      ),
                    )
                  }
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  draggable={false}
                  className="w-full text-sm bg-transparent border-0 border-b focus:outline-none"
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </li>
          );
        })}
      </ol>

      <details>
        <summary
          className="cursor-pointer text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          photos JSON ({includedCount})
        </summary>
        <textarea
          readOnly
          value={json}
          className="w-full h-64 mt-2 p-2 text-xs font-mono"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            color: "var(--text-secondary)",
          }}
        />
      </details>
    </div>
  );
}
