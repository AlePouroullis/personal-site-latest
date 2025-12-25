import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import PostList from "@/components/PostList";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function Home() {
  const posts = await getAllPosts();

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
            I&apos;m a software engineer based in San Francisco, working on
            Developer Experience at{" "}
            <a
              href="https://anthropic.com"
              target="_blank"
              rel="noopener"
              className="transition-colors"
            >
              Anthropic
            </a>
            .
          </p>

          <p style={{ color: "var(--text-secondary)" }}>
            I came up through startups—first building a mobility app in Cape
            Town&apos;s taxi industry, then a stint in London before landing
            here. I&apos;m used to being the one-person tech team, sinking my
            teeth into messy problems and figuring it out as I go.
          </p>

          <p style={{ color: "var(--text-tertiary)" }}>
            These days I&apos;m learning to balance ambition with the quieter
            things—writing is one small part of that.
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
