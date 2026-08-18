"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import { flushSync } from "react-dom";

export interface LightboxPhoto {
  src: string;
  caption?: string;
  blurDataURL?: string;
}

/** Gap between neighbouring slides while dragging. */
const GAP = 24;
/** Fraction of the viewport a drag must cross to commit without a flick. */
const COMMIT_RATIO = 0.22;
/** px/ms — a flick this fast commits regardless of distance. */
const FLICK_VELOCITY = 0.35;
/** Vertical drag distance (px) that dismisses the viewer. */
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.6;
const EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";

interface Gesture {
  startX: number;
  startY: number;
  baseX: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  prevX: number;
  prevY: number;
  prevTime: number;
  axis: "x" | "y" | null;
  moved: boolean;
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const suppressClickRef = useRef(false);
  const dismissTimerRef = useRef<number | null>(null);

  const step = useCallback(
    (delta: number) => {
      if (index === null) return;
      onNavigate((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onNavigate],
  );

  const isOpen = index !== null;
  const swipeable = photos.length > 1;

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

  // Touch dragging. Listeners are attached natively because React registers
  // touchmove passively, which would block preventDefault().
  useEffect(() => {
    const el = dialogRef.current;
    if (!el || !isOpen) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const setBackdrop = (opacity: number) => {
      el.style.background = `rgba(0, 0, 0, ${opacity})`;
    };

    const render = (x: number, y: number) => {
      const track = trackRef.current;
      if (!track) return;
      const scale = y === 0 ? 1 : Math.max(0.85, 1 - Math.abs(y) / 2000);
      track.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    };

    const animate = (x: number, y: number, ms: number) => {
      const track = trackRef.current;
      if (!track) return;
      track.style.transition = reduceMotion
        ? "none"
        : `transform ${ms}ms ${EASE}`;
      render(x, y);
    };

    const currentX = () => {
      const track = trackRef.current;
      if (!track) return 0;
      const matrix = new DOMMatrixReadOnly(getComputedStyle(track).transform);
      return matrix.m41;
    };

    const slideWidth = () => (viewportRef.current?.clientWidth ?? 0) + GAP;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        gestureRef.current = null;
        return;
      }
      // Grabbing again mid-dismiss cancels the close.
      if (dismissTimerRef.current !== null) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      const t = e.touches[0];
      const track = trackRef.current;
      const base = currentX();
      if (track) track.style.transition = "none";
      render(base, 0);
      gestureRef.current = {
        startX: t.clientX,
        startY: t.clientY,
        baseX: base,
        lastX: t.clientX,
        lastY: t.clientY,
        lastTime: e.timeStamp,
        prevX: t.clientX,
        prevY: t.clientY,
        prevTime: e.timeStamp,
        axis: null,
        moved: false,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      const g = gestureRef.current;
      if (!g) return;
      if (e.touches.length !== 1) {
        gestureRef.current = null;
        animate(0, 0, 200);
        setBackdrop(0.92);
        return;
      }
      const t = e.touches[0];
      const dx = t.clientX - g.startX;
      const dy = t.clientY - g.startY;

      if (!g.axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        g.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        g.moved = true;
      }
      e.preventDefault();

      if (g.prevTime !== g.lastTime || g.lastX !== t.clientX) {
        g.prevX = g.lastX;
        g.prevY = g.lastY;
        g.prevTime = g.lastTime;
      }
      g.lastX = t.clientX;
      g.lastY = t.clientY;
      g.lastTime = e.timeStamp;

      if (g.axis === "x") {
        // Without neighbours to swipe to, rubber-band instead of tracking 1:1.
        const travel = swipeable ? dx : dx / 4;
        render(g.baseX + travel, 0);
      } else {
        render(0, dy);
        setBackdrop(Math.max(0.4, 0.92 - Math.abs(dy) / 600));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const g = gestureRef.current;
      gestureRef.current = null;
      if (!g) return;
      if (g.moved) {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 350);
      }
      if (!g.axis) return;

      const t = e.changedTouches[0];
      const dx = t.clientX - g.startX;
      const dy = t.clientY - g.startY;
      const elapsed = Math.max(1, e.timeStamp - g.prevTime);
      const vx = (t.clientX - g.prevX) / elapsed;
      const vy = (t.clientY - g.prevY) / elapsed;

      if (g.axis === "y") {
        if (dy > DISMISS_DISTANCE || (dy > 20 && vy > DISMISS_VELOCITY)) {
          animate(0, window.innerHeight, 220);
          setBackdrop(0);
          dismissTimerRef.current = window.setTimeout(
            onClose,
            reduceMotion ? 0 : 180,
          );
        } else {
          animate(0, 0, 260);
          setBackdrop(0.92);
        }
        return;
      }

      const width = slideWidth();
      const past = Math.abs(dx) > (width - GAP) * COMMIT_RATIO;
      const flicked = Math.abs(vx) > FLICK_VELOCITY && Math.abs(dx) > 24;

      if (!swipeable || !(past || flicked) || index === null) {
        animate(0, 0, 260);
        return;
      }

      const delta = dx < 0 ? 1 : -1;
      const track = trackRef.current;
      const from = g.baseX + dx;
      // Advance the window and re-anchor the track in the same frame, so the
      // photo under the finger never jumps; then settle it into place.
      if (track) track.style.transition = "none";
      flushSync(() => {
        onNavigate((index + delta + photos.length) % photos.length);
      });
      render(from + delta * width, 0);
      trackRef.current?.getBoundingClientRect();
      // Faster settle for a flick than for a slow drag.
      animate(0, 0, flicked ? 200 : 260);
    };

    const onTouchCancel = () => {
      if (!gestureRef.current) return;
      gestureRef.current = null;
      animate(0, 0, 200);
      setBackdrop(0.92);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchCancel);
    return () => {
      if (dismissTimerRef.current !== null) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [isOpen, index, photos.length, swipeable, onClose, onNavigate]);

  if (index === null || !photos[index]) return null;

  const at = (offset: number) =>
    photos[(index + offset + photos.length) % photos.length];
  const slots = swipeable ? ([-1, 0, 1] as const) : ([0] as const);

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 outline-none"
      style={{
        background: "rgba(0, 0, 0, 0.92)",
        margin: 0,
        touchAction: "none",
      }}
      onClick={() => {
        if (suppressClickRef.current) return;
        onClose();
      }}
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
      <div
        ref={viewportRef}
        className="relative w-full h-full max-w-6xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={trackRef}
          className="absolute inset-0 will-change-transform"
          style={{ backfaceVisibility: "hidden" }}
        >
          {slots.map((offset) => {
            const photo = at(offset);
            return (
              <figure
                key={`${offset}:${photo.src}`}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                style={{
                  transform: `translate3d(calc(${offset * 100}% + ${offset * GAP}px), 0, 0)`,
                }}
                aria-hidden={offset !== 0}
              >
                <div className="relative flex-1 min-h-0 w-full">
                  <Image
                    src={photo.src}
                    alt={offset === 0 ? (photo.caption ?? "") : ""}
                    fill
                    sizes="100vw"
                    quality={90}
                    draggable={false}
                    {...(photo.blurDataURL
                      ? {
                          placeholder: "blur" as const,
                          blurDataURL: photo.blurDataURL,
                        }
                      : {})}
                    className="object-contain select-none"
                    priority={offset === 0}
                  />
                </div>
                {photo.caption && (
                  <figcaption className="text-sm text-white/80 italic text-center shrink-0">
                    {photo.caption}
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>
      </div>
    </div>
  );
}
