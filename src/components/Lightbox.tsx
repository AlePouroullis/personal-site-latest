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
/** Vertical drag distance (px) over which the controls fade away. */
const CONTROLS_FADE = 60;
const BACKDROP = 0.92;
const OPEN_MS = 140;
const CLOSE_MS = 200;
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
  const controlsRef = useRef<HTMLDivElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const suppressClickRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const closingRef = useRef(false);

  const isOpen = index !== null;
  const swipeable = photos.length > 1;

  // A monotonic counter that follows `index` through wrap-around, so each
  // slide keeps a stable React key as the window shifts. Without it every
  // swipe remounts all three images and replays their blur placeholders.
  const virtualRef = useRef(0);
  const prevIndexRef = useRef<number | null>(null);
  if (index !== null) {
    const prev = prevIndexRef.current;
    if (prev === null) {
      virtualRef.current = index;
    } else if (prev !== index) {
      const len = photos.length;
      const forward = (index - prev + len) % len;
      virtualRef.current += forward * 2 <= len ? forward : forward - len;
    }
  }
  prevIndexRef.current = index;

  /** Fade the whole viewer out before handing the close back to the parent. */
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const el = dialogRef.current;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!el || reduceMotion) {
      onClose();
      return;
    }
    el.style.pointerEvents = "none";
    el.style.animation = "none";
    el.style.transition = `opacity ${CLOSE_MS}ms ease-out`;
    el.style.opacity = "0";
    closeTimerRef.current = window.setTimeout(onClose, CLOSE_MS);
  }, [onClose]);

  const step = useCallback(
    (delta: number) => {
      if (index === null || closingRef.current) return;
      onNavigate((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onNavigate],
  );

  useEffect(() => {
    if (!isOpen) return;
    // A reopen inside the closing fade must not inherit its pending close.
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    closingRef.current = false;
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
      closingRef.current = false;
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, requestClose, step]);

  // Touch dragging. Listeners are attached natively because React registers
  // touchmove passively, which would block preventDefault().
  useEffect(() => {
    const el = dialogRef.current;
    if (!el || !isOpen) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const setChrome = (backdrop: number, controls: number) => {
      el.style.background = `rgba(0, 0, 0, ${backdrop})`;
      if (controlsRef.current)
        controlsRef.current.style.opacity = `${controls}`;
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
      if (e.touches.length !== 1 || closingRef.current) {
        gestureRef.current = null;
        return;
      }
      const t = e.touches[0];
      const track = trackRef.current;
      const base = currentX();
      if (track) track.style.transition = "none";
      if (controlsRef.current) controlsRef.current.style.transition = "none";
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

    const settleChrome = () => {
      if (controlsRef.current) {
        controlsRef.current.style.transition = `opacity 200ms ease-out`;
      }
      setChrome(BACKDROP, 1);
    };

    const onTouchMove = (e: TouchEvent) => {
      const g = gestureRef.current;
      if (!g) return;
      if (e.touches.length !== 1) {
        gestureRef.current = null;
        animate(0, 0, 200);
        settleChrome();
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
        setChrome(
          Math.max(0.4, BACKDROP - Math.abs(dy) / 600),
          Math.max(0, 1 - Math.abs(dy) / CONTROLS_FADE),
        );
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
          // Let the photo keep falling while the whole viewer fades out.
          animate(0, dy + 220, CLOSE_MS);
          requestClose();
        } else {
          animate(0, 0, 260);
          settleChrome();
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
      settleChrome();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchCancel);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [isOpen, index, photos.length, swipeable, requestClose, onNavigate]);

  if (index === null || !photos[index]) return null;

  const slots = swipeable ? ([-1, 0, 1] as const) : ([0] as const);

  /**
   * Whether a point lands on the photo itself. `fill` stretches the <img> box
   * across the whole slide, so the letterboxed painted area has to be derived
   * from the photo's own aspect ratio.
   */
  const hitsPhoto = (clientX: number, clientY: number, target: HTMLElement) => {
    if (target.closest("figcaption")) return true;
    const img = trackRef.current?.querySelector<HTMLImageElement>(
      'figure[data-active="true"] img',
    );
    if (!img?.naturalWidth || !img.naturalHeight) return false;
    const box = img.getBoundingClientRect();
    const scale = Math.min(
      box.width / img.naturalWidth,
      box.height / img.naturalHeight,
    );
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const left = box.left + (box.width - w) / 2;
    const top = box.top + (box.height - h) / 2;
    return (
      clientX >= left &&
      clientX <= left + w &&
      clientY >= top &&
      clientY <= top + h
    );
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 outline-none"
      style={{
        background: `rgba(0, 0, 0, ${BACKDROP})`,
        margin: 0,
        touchAction: "none",
        animation: `lightbox-in ${OPEN_MS}ms ease-out`,
      }}
      onClick={(e) => {
        if (suppressClickRef.current) return;
        if (hitsPhoto(e.clientX, e.clientY, e.target as HTMLElement)) return;
        requestClose();
      }}
    >
      <div
        ref={controlsRef}
        className="absolute inset-0 z-10 pointer-events-none"
      >
        <button
          type="button"
          onClick={requestClose}
          aria-label="Close"
          className="absolute top-2 right-2 sm:top-4 sm:right-4 flex h-11 w-11 items-center justify-center text-white/70 transition-colors hover:text-white cursor-pointer pointer-events-auto"
        >
          <CloseIcon />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            step(-1);
          }}
          aria-label="Previous"
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center text-white/70 transition-colors hover:text-white cursor-pointer pointer-events-auto"
        >
          <ChevronIcon direction="left" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            step(1);
          }}
          aria-label="Next"
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center text-white/70 transition-colors hover:text-white cursor-pointer pointer-events-auto"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>
      <div
        ref={viewportRef}
        className="relative w-full h-full max-w-6xl overflow-hidden"
      >
        <div
          ref={trackRef}
          className="absolute inset-0 will-change-transform"
          style={{ backfaceVisibility: "hidden" }}
        >
          {slots.map((offset) => {
            const virtual = virtualRef.current + offset;
            const photo =
              photos[
                ((virtual % photos.length) + photos.length) % photos.length
              ];
            return (
              <figure
                key={virtual}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                style={{
                  transform: `translate3d(calc(${offset * 100}% + ${offset * GAP}px), 0, 0)`,
                }}
                aria-hidden={offset !== 0}
                data-active={offset === 0 ? "true" : undefined}
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
                    // objectFit must be in `style`, not just the class: Next
                    // sizes the blur placeholder from it, and otherwise paints
                    // it full-bleed before snapping to the letterboxed photo.
                    style={{ objectFit: "contain" }}
                    className="select-none"
                    priority
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

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline
        points={direction === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"}
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
