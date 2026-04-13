"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Photo } from "@/lib/photos";

export default function PhotoColumn({ photos }: { photos: Photo[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const open = useCallback((i: number) => {
    lastFocusRef.current = document.activeElement as HTMLElement;
    setActiveIndex(i);
  }, []);
  const close = useCallback(() => setActiveIndex(null), []);
  const step = useCallback(
    (delta: number) =>
      setActiveIndex((i) =>
        i === null ? null : (i + delta + photos.length) % photos.length,
      ),
    [photos.length],
  );

  const isOpen = activeIndex !== null;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    const { documentElement, body } = document;
    const prevHtml = documentElement.style.overflow;
    const prevBody = body.style.overflow;
    documentElement.style.overflow = "hidden";
    body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      documentElement.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      lastFocusRef.current?.focus();
    };
  }, [isOpen, close, step]);

  const active = activeIndex !== null ? photos[activeIndex] : null;

  return (
    <>
      <div className="space-y-12">
        {photos.map((photo, i) => (
          <figure key={photo.src}>
            <button
              type="button"
              onClick={() => open(i)}
              className="block w-full cursor-zoom-in"
              aria-label={
                photo.caption
                  ? `View full size: ${photo.caption}`
                  : "View full size"
              }
            >
              <Image
                src={photo.src}
                alt={photo.caption ?? ""}
                width={photo.width}
                height={photo.height}
                sizes="(max-width: 768px) 100vw, 650px"
                quality={85}
                className="w-full h-auto"
                priority={i === 0}
              />
            </button>
            {photo.caption && (
              <figcaption
                className="mt-2 text-sm italic"
                style={{ color: "var(--text-muted)" }}
              >
                {photo.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {active && (
        <div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 outline-none"
          style={{ background: "rgba(0, 0, 0, 0.92)", margin: 0 }}
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none cursor-pointer p-2"
          >
            ×
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Previous"
            className="absolute left-2 sm:left-6 text-white/70 hover:text-white text-4xl leading-none select-none cursor-pointer p-2"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Next"
            className="absolute right-2 sm:right-6 text-white/70 hover:text-white text-4xl leading-none select-none cursor-pointer p-2"
          >
            ›
          </button>
          <figure
            className="w-full h-full max-w-6xl flex flex-col items-center justify-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex-1 min-h-0 w-full">
              <Image
                src={active.src}
                alt={active.caption ?? ""}
                fill
                sizes="100vw"
                quality={90}
                className="object-contain"
                priority
              />
            </div>
            {active.caption && (
              <figcaption className="text-sm text-white/80 italic text-center shrink-0">
                {active.caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  );
}
