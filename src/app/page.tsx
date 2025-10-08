import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import PostList from "@/components/PostList";

export default async function Home() {
  const posts = await getAllPosts();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-8">
        <h1
          className="text-3xl font-medium"
          style={{ color: "var(--heading-color)" }}
        >
          Alé Pouroullis
        </h1>

        <div className="space-y-6 bio-section">
          <p style={{ color: "var(--text-primary)" }}>
            I&apos;m a software engineer now living in San Francisco. These days, I work on
            Developer Experience at{" "}
            <a href="https://www.anthropic.com" target="_blank" rel="noopener">
              Anthropic
            </a>
            , helping people build more easily with Claude.
          </p>

          <p style={{ color: "var(--text-secondary)" }}>
            I made my way across the world, from Cape Town, where I was studying
            Computer Science at, you guessed it, the University of Cape Town. Somewhere in there,
            I helped build a mobility startup called{" "}
            <a
              href="https://www.linkedin.com/company/looptaxiapp/"
              target="_blank"
              rel="noopener"
            >
              Loop
            </a>{" "}
            where we tried to address the notorious taxi industry in South
            Africa. The journey took me through London, and now here I am in San Francisco—
            still chasing better ways to build things.
          </p>

          <p style={{ color: "var(--text-tertiary)" }}>
            If you dig even further, you&apos;ll find that there was a time I
            fancied myself a musician. I&apos;m mostly a listener now, though
            with each passing year I tell myself I&apos;ll eventually make a
            return. But alas, the capitalist machine leads one astray...
            <br />
            Or maybe I&apos;m just lazy.
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
