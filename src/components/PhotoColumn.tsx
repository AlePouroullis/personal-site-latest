"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import type { Photo } from "@/lib/photos";
import Lightbox from "@/components/Lightbox";

export default function PhotoColumn({ photos }: { photos: Photo[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);

  return (
    <>
      <div className="space-y-6">
        {photos.map((photo, i) => (
          <figure key={photo.src}>
            <button
              type="button"
              onClick={() => setActiveIndex(i)}
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
                placeholder="blur"
                blurDataURL={photo.blurDataURL}
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

      <Lightbox
        photos={photos}
        index={activeIndex}
        onClose={close}
        onNavigate={setActiveIndex}
      />
    </>
  );
}
