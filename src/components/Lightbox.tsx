"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";

export interface LightboxPhoto {
  src: string;
  caption?: string;
  blurDataURL?: string;
}

export default function Lightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: LightboxPhoto[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const step = useCallback(
    (delta: number) => {
      if (index === null) return;
      onNavigate((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onNavigate],
  );

  const isOpen = index !== null;

  useEffect(() => {
    if (!isOpen) return;
    lastFocusRef.current = document.activeElement as HTMLElement;
    const { documentElement, body } = document;
    const prevHtml = documentElement.style.overflow;
    const prevBody = body.style.overflow;
    documentElement.style.overflow = "hidden";
    body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      documentElement.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      lastFocusRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, step]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const threshold = 50;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      step(dx < 0 ? 1 : -1);
    } else if (dy > threshold && Math.abs(dy) > Math.abs(dx)) {
      onClose();
    }
  };

  const active = index !== null ? photos[index] : null;
  if (!active) return null;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 outline-none touch-pan-y"
      style={{ background: "rgba(0, 0, 0, 0.92)", margin: 0 }}
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-0 right-0 z-10 text-white/70 hover:text-white text-3xl leading-none cursor-pointer p-4"
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
        className="absolute left-0 sm:left-6 top-1/2 -translate-y-1/2 z-10 text-white/70 hover:text-white text-4xl leading-none select-none cursor-pointer p-4"
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
        className="absolute right-0 sm:right-6 top-1/2 -translate-y-1/2 z-10 text-white/70 hover:text-white text-4xl leading-none select-none cursor-pointer p-4"
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
            {...(active.blurDataURL
              ? {
                  placeholder: "blur" as const,
                  blurDataURL: active.blurDataURL,
                }
              : {})}
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
  );
}
