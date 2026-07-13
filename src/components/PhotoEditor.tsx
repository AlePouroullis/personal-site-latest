"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Photo } from "@/lib/photos";
import Lightbox from "@/components/Lightbox";

interface Item {
  file: string;
  caption: string;
  included: boolean;
  src: string;
  blurDataURL: string;
}

interface EditorState {
  items: Item[];
  cover: string;
}

type Filter = "all" | "in" | "out";

interface MarqueeRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const NO_PHOTOS: Photo[] = [];

export default function PhotoEditor({
  photos,
  excluded = NO_PHOTOS,
  slug,
  cover,
  manifest,
}: {
  photos: Photo[];
  excluded?: Photo[];
  slug: string;
  cover?: string;
  manifest?: Record<string, unknown>;
}) {
  const initial = useMemo<EditorState>(() => {
    const toItem = (p: Photo, included: boolean) => ({
      file: p.src.split("/").pop()!,
      caption: p.caption ?? "",
      included,
      src: p.src,
      blurDataURL: p.blurDataURL,
    });
    const items = [
      ...photos.map((p) => toItem(p, true)),
      ...excluded.map((p) => toItem(p, false)),
    ];
    return { items, cover: cover ?? items[0]?.file ?? "" };
  }, [photos, excluded, cover]);

  const [state, setState] = useState<EditorState>(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const anchorRef = useRef<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  const gridRef = useRef<HTMLOListElement>(null);
  const dragSetRef = useRef<Set<string> | null>(null);
  const undoRef = useRef<EditorState[]>([]);
  const redoRef = useRef<EditorState[]>([]);
  const tileRefs = useRef(new Map<string, HTMLElement>());
  const marqueeRef = useRef<{
    base: Set<string>;
    mode: "replace" | "add" | "subtract";
    startX: number;
    startY: number;
    active: boolean;
  } | null>(null);

  const storageKey = `photo-editor:${slug}`;

  // Restore a previous session's pass (order, culls, captions, cover).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        cover: string;
        items: { file: string; caption: string; included: boolean }[];
      };
      const byFile = new Map(initial.items.map((i) => [i.file, i]));
      if (
        saved.items.length !== byFile.size ||
        !saved.items.every((s) => byFile.has(s.file))
      )
        return;
      setState({
        cover: byFile.has(saved.cover) ? saved.cover : initial.cover,
        items: saved.items.map((s) => ({
          ...byFile.get(s.file)!,
          caption: s.caption,
          included: s.included,
        })),
      });
    } catch {
      // ignore corrupt saved state
    }
  }, [storageKey, initial]);

  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          cover: state.cover,
          items: state.items.map(({ file, caption, included }) => ({
            file,
            caption,
            included,
          })),
        }),
      );
    }, 300);
    return () => clearTimeout(t);
  }, [state, storageKey]);

  const apply = useCallback((updater: (prev: EditorState) => EditorState) => {
    setState((prev) => {
      undoRef.current.push(prev);
      if (undoRef.current.length > 100) undoRef.current.shift();
      redoRef.current = [];
      return updater(prev);
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      const last = undoRef.current.pop();
      if (!last) return prev;
      redoRef.current.push(prev);
      return last;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      const next = redoRef.current.pop();
      if (!next) return prev;
      undoRef.current.push(prev);
      return next;
    });
  }, []);

  const { items } = state;
  const visibleItems = useMemo(
    () =>
      filter === "all"
        ? items
        : items.filter((i) => (filter === "in" ? i.included : !i.included)),
    [items, filter],
  );

  const indexOf = (file: string) =>
    visibleItems.findIndex((x) => x.file === file);

  const handleSelect = (file: string, e: React.MouseEvent) => {
    cursorRef.current = file;
    const i = indexOf(file);
    if (e.shiftKey && anchorRef.current) {
      const a = indexOf(anchorRef.current);
      if (a !== -1 && i !== -1) {
        const [lo, hi] = a < i ? [a, i] : [i, a];
        const range = new Set(
          visibleItems.slice(lo, hi + 1).map((x) => x.file),
        );
        setSelected((prev) =>
          e.metaKey || e.ctrlKey ? new Set([...prev, ...range]) : range,
        );
        return;
      }
    }
    if (e.metaKey || e.ctrlKey) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(file)) next.delete(file);
        else next.add(file);
        return next;
      });
    } else {
      setSelected(new Set([file]));
    }
    anchorRef.current = file;
  };

  const setIncluded = useCallback(
    (files: Set<string>, included: boolean) => {
      apply((s) => ({
        ...s,
        items: s.items.map((it) =>
          files.has(it.file) ? { ...it, included } : it,
        ),
      }));
    },
    [apply],
  );

  const toggleIncluded = useCallback(
    (files: Set<string>) => {
      const anyIncluded = state.items.some(
        (it) => files.has(it.file) && it.included,
      );
      setIncluded(files, !anyIncluded);
    },
    [state.items, setIncluded],
  );

  const moveSelected = (where: "top" | "bottom") => {
    apply((s) => {
      const moving = s.items.filter((i) => selected.has(i.file));
      const rest = s.items.filter((i) => !selected.has(i.file));
      return {
        ...s,
        items: where === "top" ? [...moving, ...rest] : [...rest, ...moving],
      };
    });
  };

  // --- drag to reorder ---

  const handleDragStart = (file: string, e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", file);
    e.dataTransfer.effectAllowed = "move";
    dragSetRef.current = selected.has(file) ? selected : new Set([file]);
    if (!selected.has(file)) setSelected(new Set([file]));
  };

  const handleDrop = (target: string) => {
    const moving = dragSetRef.current;
    dragSetRef.current = null;
    setDropTarget(null);
    if (!moving || moving.size === 0) return;
    apply((s) => {
      const movingItems = s.items.filter((x) => moving.has(x.file));
      const remaining = s.items.filter((x) => !moving.has(x.file));
      let insertAt = remaining.findIndex((x) => x.file === target);
      if (insertAt === -1) insertAt = remaining.length;
      remaining.splice(insertAt, 0, ...movingItems);
      return { ...s, items: remaining };
    });
  };

  // --- marquee (drag on background to select) ---

  const setTileRef = (file: string) => (el: HTMLElement | null) => {
    if (el) tileRefs.current.set(file, el);
    else tileRefs.current.delete(file);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-tile]")) return;
    marqueeRef.current = {
      base: new Set(selected),
      mode: e.shiftKey ? "add" : e.altKey ? "subtract" : "replace",
      startX: e.clientX,
      startY: e.clientY,
      active: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const m = marqueeRef.current;
    if (!m) return;
    if (!m.active && Math.hypot(e.clientX - m.startX, e.clientY - m.startY) < 4)
      return;
    m.active = true;
    const rect: MarqueeRect = {
      x1: Math.min(m.startX, e.clientX),
      y1: Math.min(m.startY, e.clientY),
      x2: Math.max(m.startX, e.clientX),
      y2: Math.max(m.startY, e.clientY),
    };
    setMarquee(rect);
    const hit = new Set<string>();
    for (const [file, el] of tileRefs.current) {
      const r = el.getBoundingClientRect();
      if (
        r.right >= rect.x1 &&
        r.left <= rect.x2 &&
        r.bottom >= rect.y1 &&
        r.top <= rect.y2
      )
        hit.add(file);
    }
    let next: Set<string>;
    if (m.mode === "add") next = new Set([...m.base, ...hit]);
    else if (m.mode === "subtract") {
      next = new Set(m.base);
      hit.forEach((f) => next.delete(f));
    } else next = hit;
    setSelected(next);
  };

  const onPointerUp = () => {
    const m = marqueeRef.current;
    marqueeRef.current = null;
    setMarquee(null);
    if (m && !m.active && m.mode === "replace") setSelected(new Set());
  };

  // --- keyboard ---

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement)
        return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
        return;
      }
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelected(new Set(visibleItems.map((i) => i.file)));
        return;
      }
      if (previewIndex !== null) {
        const current = visibleItems[previewIndex];
        if (!current) return;
        if (e.key.toLowerCase() === "x")
          toggleIncluded(new Set([current.file]));
        if (e.key.toLowerCase() === "c")
          apply((s) => ({ ...s, cover: current.file }));
        return;
      }
      if (e.key === "Escape") setSelected(new Set());
      if (e.key.toLowerCase() === "x" && selected.size)
        toggleIncluded(selected);
      if ((e.key === " " || e.key === "Enter") && selected.size === 1) {
        e.preventDefault();
        const i = indexOf([...selected][0]);
        if (i !== -1) setPreviewIndex(i);
      }
      if (e.key.startsWith("Arrow") && visibleItems.length) {
        e.preventDefault();
        const cols = gridRef.current
          ? getComputedStyle(gridRef.current).gridTemplateColumns.split(" ")
              .length
          : 1;
        const delta =
          e.key === "ArrowLeft"
            ? -1
            : e.key === "ArrowRight"
              ? 1
              : e.key === "ArrowUp"
                ? -cols
                : cols;
        const from = cursorRef.current ? indexOf(cursorRef.current) : -1;
        const next =
          from === -1
            ? 0
            : Math.min(Math.max(from + delta, 0), visibleItems.length - 1);
        const file = visibleItems[next].file;
        cursorRef.current = file;
        if (
          e.shiftKey &&
          anchorRef.current &&
          indexOf(anchorRef.current) !== -1
        ) {
          const a = indexOf(anchorRef.current);
          const [lo, hi] = a < next ? [a, next] : [next, a];
          setSelected(
            new Set(visibleItems.slice(lo, hi + 1).map((x) => x.file)),
          );
        } else {
          setSelected(new Set([file]));
          anchorRef.current = file;
        }
        tileRefs.current.get(file)?.scrollIntoView({ block: "nearest" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Keep the preview index valid when filtering shrinks the visible list.
  useEffect(() => {
    if (previewIndex !== null && previewIndex >= visibleItems.length) {
      setPreviewIndex(visibleItems.length ? visibleItems.length - 1 : null);
    }
  }, [previewIndex, visibleItems.length]);

  // --- output ---

  const includedCount = items.filter((i) => i.included).length;
  const includedOrder = useMemo(() => {
    const order = new Map<string, number>();
    let n = 0;
    for (const it of items) if (it.included) order.set(it.file, ++n);
    return order;
  }, [items]);

  const outPhotos = useMemo(
    () =>
      items
        .filter((i) => i.included)
        .map((i) =>
          i.caption ? { file: i.file, caption: i.caption } : { file: i.file },
        ),
    [items],
  );

  // Full manifest file content: existing fields preserved, cover/photos updated.
  const json = useMemo(
    () =>
      JSON.stringify(
        { ...(manifest ?? {}), cover: state.cover, photos: outPhotos },
        null,
        2,
      ) + "\n",
    [manifest, outPhotos, state.cover],
  );

  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const save = useCallback(async () => {
    if (!outPhotos.length) return;
    setSaveState("saving");
    try {
      const res = await fetch(`/api/photography/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover: state.cover, photos: outPhotos }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }, [slug, state.cover, outPhotos]);

  const lightboxPhotos = useMemo(
    () =>
      visibleItems.map((item) => ({
        src: item.src,
        caption: `${item.file}${item.included ? "" : " (excluded)"}${
          item.file === state.cover ? " ★ cover" : ""
        }${item.caption ? ` — ${item.caption}` : ""}`,
        blurDataURL: item.blurDataURL,
      })),
    [visibleItems, state.cover],
  );

  const singleSelected =
    selected.size === 1
      ? items.find((i) => i.file === [...selected][0])
      : undefined;

  const filterTab = (f: Filter, label: string) => (
    <button
      type="button"
      onClick={() => setFilter(f)}
      className="cursor-pointer"
      style={{
        color: filter === f ? "var(--heading-color)" : "var(--text-muted)",
        textDecoration: filter === f ? "underline" : "none",
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <div
        className="text-sm flex flex-wrap items-center justify-between gap-x-4 gap-y-1"
        style={{ color: "var(--text-muted)" }}
      >
        <span>
          {includedCount} of {items.length} included · cover:{" "}
          <span className="font-mono text-xs">{state.cover}</span>
          {selected.size > 0 && (
            <>
              {" · "}
              <strong>{selected.size} selected</strong>
            </>
          )}
        </span>
        <span className="flex items-center gap-3">
          {filterTab("all", "all")}
          {filterTab("in", `in (${includedCount})`)}
          {filterTab("out", `out (${items.length - includedCount})`)}
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
            {copied ? "copied ✓" : "copy JSON"}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saveState === "saving" || outPhotos.length === 0}
            className="cursor-pointer underline shrink-0 font-medium disabled:opacity-50"
            style={{
              color:
                saveState === "error"
                  ? "#c0392b"
                  : saveState === "saved"
                    ? "var(--link-underline)"
                    : "var(--heading-color)",
            }}
          >
            {saveState === "saving"
              ? "saving…"
              : saveState === "saved"
                ? "saved ✓"
                : saveState === "error"
                  ? "save failed — retry"
                  : "save"}
          </button>
        </span>
      </div>

      <div
        className="text-sm flex flex-wrap items-center gap-x-3 gap-y-1"
        style={{ color: "var(--text-muted)" }}
      >
        select:
        <button
          type="button"
          className="cursor-pointer underline"
          onClick={() => setSelected(new Set(visibleItems.map((i) => i.file)))}
        >
          all
        </button>
        <button
          type="button"
          className="cursor-pointer underline"
          onClick={() => setSelected(new Set())}
        >
          none
        </button>
        <button
          type="button"
          className="cursor-pointer underline"
          onClick={() =>
            setSelected(
              new Set(
                visibleItems
                  .filter((i) => !selected.has(i.file))
                  .map((i) => i.file),
              ),
            )
          }
        >
          invert
        </button>
        <button
          type="button"
          className="cursor-pointer underline"
          onClick={() =>
            setSelected(
              new Set(items.filter((i) => !i.included).map((i) => i.file)),
            )
          }
        >
          excluded
        </button>
        {selected.size > 0 && (
          <>
            <span style={{ color: "var(--text-light)" }}>·</span>
            <button
              type="button"
              className="cursor-pointer underline"
              onClick={() => setIncluded(selected, true)}
            >
              include
            </button>
            <button
              type="button"
              className="cursor-pointer underline"
              onClick={() => setIncluded(selected, false)}
            >
              exclude
            </button>
            <button
              type="button"
              className="cursor-pointer underline"
              onClick={() => moveSelected("top")}
            >
              → top
            </button>
            <button
              type="button"
              className="cursor-pointer underline"
              onClick={() => moveSelected("bottom")}
            >
              → bottom
            </button>
          </>
        )}
        <span className="grow" />
        <button
          type="button"
          className="cursor-pointer underline"
          style={{ color: "var(--text-light)" }}
          onClick={() => {
            localStorage.removeItem(storageKey);
            apply(() => initial);
            setSelected(new Set());
          }}
        >
          reset
        </button>
      </div>

      {singleSelected && (
        <div
          className="flex items-center gap-2 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <span className="font-mono text-xs shrink-0">
            {singleSelected.file}
          </span>
          <input
            type="text"
            value={singleSelected.caption}
            placeholder="caption (optional)"
            onChange={(e) =>
              apply((s) => ({
                ...s,
                items: s.items.map((x) =>
                  x.file === singleSelected.file
                    ? { ...x, caption: e.target.value }
                    : x,
                ),
              }))
            }
            className="w-full text-sm bg-transparent border-0 border-b focus:outline-none"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="button"
            className="cursor-pointer underline shrink-0"
            onClick={() => apply((s) => ({ ...s, cover: singleSelected.file }))}
          >
            set cover
          </button>
        </div>
      )}

      <p className="text-xs" style={{ color: "var(--text-light)" }}>
        click or arrows to select (⇧ extends, ⌘ toggles) · drag background to
        marquee-select (⇧ add, ⌥ remove) · drag tiles to reorder · double-click
        or space to preview · x include/exclude · c sets cover in preview · ⌘Z
        undo
      </p>

      <ol
        ref={gridRef}
        className="grid grid-cols-3 sm:grid-cols-4 gap-2 select-none touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDragOver={(e) => {
          e.preventDefault();
          if (!(e.target as HTMLElement).closest("[data-tile]"))
            setDropTarget("__end");
        }}
        onDrop={(e) => {
          if (!(e.target as HTMLElement).closest("[data-tile]"))
            handleDrop("__end");
        }}
      >
        {visibleItems.map((item, i) => {
          const isSelected = selected.has(item.file);
          const isCover = item.file === state.cover;
          const order = includedOrder.get(item.file);
          return (
            <li
              key={item.file}
              data-tile
              ref={setTileRef(item.file)}
              draggable
              onDragStart={(e) => handleDragStart(item.file, e)}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDropTarget(item.file);
              }}
              onDrop={(e) => {
                e.stopPropagation();
                handleDrop(item.file);
              }}
              onDragEnd={() => {
                dragSetRef.current = null;
                setDropTarget(null);
              }}
              onClick={(e) => handleSelect(item.file, e)}
              onDoubleClick={() => setPreviewIndex(i)}
              className="cursor-move group"
              style={{
                transition: "none",
                background: isSelected
                  ? "color-mix(in srgb, var(--link-underline) 12%, var(--bg-primary))"
                  : "var(--bg-primary)",
                border: `1px solid ${
                  isSelected ? "var(--link-underline)" : "var(--border-color)"
                }`,
                boxShadow:
                  dropTarget === item.file
                    ? "inset 3px 0 0 var(--link-underline)"
                    : undefined,
              }}
            >
              <div
                className="relative aspect-[3/2]"
                style={{ opacity: item.included ? 1 : 0.35 }}
              >
                <Image
                  src={item.src}
                  alt=""
                  fill
                  sizes="200px"
                  className="object-cover"
                  draggable={false}
                />
                {order !== undefined && (
                  <span className="absolute top-1 left-1 text-[10px] leading-none px-1 py-0.5 rounded bg-black/60 text-white">
                    {order}
                  </span>
                )}
                <input
                  type="checkbox"
                  checked={item.included}
                  onChange={(e) =>
                    setIncluded(new Set([item.file]), e.target.checked)
                  }
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className="absolute top-1 right-1 cursor-pointer"
                  aria-label={`Include ${item.file}`}
                />
              </div>
              <div className="flex items-center justify-between gap-1 px-1 py-0.5">
                <span
                  className="text-[10px] font-mono truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.file}
                  {item.caption && " ✎"}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    apply((s) => ({ ...s, cover: item.file }));
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  aria-label={`Set ${item.file} as cover`}
                  className={`text-[11px] leading-none cursor-pointer shrink-0 ${
                    isCover ? "" : "opacity-0 group-hover:opacity-60"
                  }`}
                  style={{
                    color: isCover
                      ? "var(--link-underline)"
                      : "var(--text-muted)",
                  }}
                >
                  ★
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {marquee && (
        <div
          className="fixed z-40 pointer-events-none"
          style={{
            transition: "none",
            left: marquee.x1,
            top: marquee.y1,
            width: marquee.x2 - marquee.x1,
            height: marquee.y2 - marquee.y1,
            border: "1px solid var(--link-underline)",
            background:
              "color-mix(in srgb, var(--link-underline) 15%, transparent)",
          }}
        />
      )}

      <details>
        <summary
          className="cursor-pointer text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          JSON ({includedCount} photos)
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

      <Lightbox
        photos={lightboxPhotos}
        index={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onNavigate={setPreviewIndex}
      />
    </div>
  );
}
