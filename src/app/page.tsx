import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { getAllCollections } from "@/lib/photos";
import PostList from "@/components/PostList";
import CollectionList from "@/components/CollectionList";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function Home() {
  const posts = await getAllPosts();
  const collections = await getAllCollections();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1
            className="text-3xl font-medium"
            style={{ color: "var(--heading-color)" }}
          >
            Alé Pouroullis
          </h1>
          <ThemeToggle />
        </div>

        <div className="space-y-6 bio-section">
          <p style={{ color: "var(--text-primary)" }}>
            I&apos;m a software engineer at{" "}
            <a
              href="https://anthropic.com"
              target="_blank"
              rel="noopener"
              className="transition-colors"
            >
              Anthropic
            </a>
            . Hailing from South Africa, now based in San Francisco.
          </p>

          <p style={{ color: "var(--text-primary)" }}>
            Sundays you can find me cycling through Golden Gate Park, bossa nova
            in ear. The rest of the week I try to keep up with creative
            endeavours, like some of the photography and writing you can find
            here.
          </p>
        </div>
      </div>

      {/* Essays Navigation */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2
            className="text-xl font-medium"
            style={{ color: "var(--heading-color)" }}
          >
            Recent Writing
          </h2>
          <Link href="/essays" className="transition-colors">
            View all →
          </Link>
        </div>

        <PostList posts={posts} limit={3} />
      </div>

      {/* Photography */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2
            className="text-xl font-medium"
            style={{ color: "var(--heading-color)" }}
          >
            Photography
          </h2>
          <Link href="/photography" className="transition-colors">
            View all →
          </Link>
        </div>

        <CollectionList collections={collections} limit={3} compact />
      </div>

      {/* Contact */}
      <div
        className="space-y-6 pt-10 border-t contact-section"
        style={{ borderColor: "var(--border-color)" }}
      >
        <h2 style={{ color: "var(--heading-color)" }}>Connect</h2>

        <div className="space-y-3" style={{ color: "var(--text-secondary)" }}>
          <div>
            <a
              href="mailto:alexpouroullis@gmail.com"
              className="hover:text-amber-950"
            >
              alexpouroullis@gmail.com
            </a>
          </div>

          <div className="flex space-x-8 text-sm">
            <a
              href="https://github.com/AlePouroullis"
              target="_blank"
              rel="noopener"
              className="transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/alexandros-pouroullis-a105051b6/"
              target="_blank"
              rel="noopener"
              className="transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="/cv.pdf"
              target="_blank"
              rel="noopener"
              className="transition-colors"
            >
              CV
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
