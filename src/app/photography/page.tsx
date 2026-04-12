import Link from "next/link";
import { Metadata } from "next";
import { getAllCollections } from "@/lib/photos";
import CollectionList from "@/components/CollectionList";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Photography",
  description: "Photo collections by Alé Pouroullis.",
};

export default async function PhotographyPage() {
  const collections = await getAllCollections();

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <Link href="/">← Home</Link>
        <ThemeToggle />
      </div>
      <div className="space-y-4">
        <h1
          className="text-3xl font-medium"
          style={{ color: "var(--heading-color)" }}
        >
          Photography
        </h1>
        <p
          className="leading-relaxed"
          style={{ color: "var(--text-tertiary)" }}
        >
          Occasional collections—places I&apos;ve been, things that caught my eye.
        </p>
      </div>
      {collections.length > 0 ? (
        <CollectionList collections={collections} />
      ) : (
        <p style={{ color: "var(--text-muted)" }}>No collections yet.</p>
      )}
    </div>
  );
}
