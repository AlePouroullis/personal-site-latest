"use client";

import { useRef, useState } from "react";
import type { CollectionAudio as Audio } from "@/lib/photos";

export default function CollectionAudio({ audio }: { audio: Audio }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      el.play();
    } else {
      el.pause();
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        aria-pressed={playing}
        className="cursor-pointer hover:opacity-70 transition-opacity"
        style={{
          color: "var(--text-muted)",
          background: "none",
          border: "none",
          padding: 0,
          font: "inherit",
        }}
      >
        {playing ? "❚❚" : "▸"} <span className="italic">{audio.title}</span>
      </button>
      <audio
        ref={ref}
        src={audio.src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </span>
  );
}
