import Link from "next/link";
import Image from "next/image";
import type { CollectionMeta } from "@/lib/photos";
import styles from "./CollectionList.module.css";

function fmt(d: Date) {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

export default function CollectionList({
  collections,
  limit,
  compact = false,
}: {
  collections: CollectionMeta[];
  limit?: number;
  compact?: boolean;
}) {
  const items = limit ? collections.slice(0, limit) : collections;

  if (compact) {
    return (
      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c.slug}>
            <Link href={`/photography/${c.slug}`} className={styles.rowLink}>
              <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded">
                <Image
                  src={c.cover.src}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color: "var(--text-primary)" }}>{c.title}</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {fmt(c.date)}
                </div>
              </div>
              <span
                className="text-sm shrink-0"
                style={{ color: "var(--text-light)" }}
              >
                {c.count} photo{c.count === 1 ? "" : "s"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-10">
      {items.map((c) => (
        <li key={c.slug}>
          <Link href={`/photography/${c.slug}`} className={styles.cardLink}>
            <div className="relative aspect-[3/2] overflow-hidden mb-3">
              <Image
                src={c.cover.src}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 650px"
                className={`object-cover ${styles.cover}`}
              />
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <h2
                className="text-xl"
                style={{ color: "var(--heading-color)" }}
              >
                {c.title}
              </h2>
              <span
                className="text-sm shrink-0"
                style={{ color: "var(--text-muted)" }}
              >
                {fmt(c.date)} · {c.count} photo{c.count === 1 ? "" : "s"}
              </span>
            </div>
            <p
              className="mt-1 leading-relaxed"
              style={{ color: "var(--text-tertiary)" }}
            >
              {c.intro}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
