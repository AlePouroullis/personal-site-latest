import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function Home() {
  const posts = getAllPosts();

  return (
    <div
      className="min-h-screen"
    >
      <div className="max-w-xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
        <div className="space-y-10">
          {/* Header */}
          <div className="space-y-8">
            <h1
              className="text-3xl font-medium"
              style={{ color: "var(--heading-color)" }}
            >
              Alé Pouroullis
            </h1>

            <div className="space-y-6">
              <p
                className="text-lg leading-relaxed"
                style={{ color: "var(--text-primary)" }}
              >
                I build tools at{" "}
                <a href="https://humanloop.com" target="_blank" rel="noopener">
                  Humanloop
                </a>{" "}
                that help companies integrate AI into their workflows. Recently
                moved from Cape Town to London, still figuring out which coffee
                shops understand flat whites.
              </p>

              <p style={{ color: "var(--text-secondary)" }}>
                I studied Computer Science at UCT, but spent most of my time
                learning things they didn&apos;t teach—how to build software
                that people actually use, why startups fail, and what happens
                when you say yes to everything. These days I&apos;m more
                selective about my yeses.
              </p>

              <p style={{ color: "var(--text-tertiary)" }}>
                I&apos;m drawn to the spaces between disciplines—where code
                meets human behavior, where technical decisions become
                philosophical ones, and where the most interesting problems
                don&apos;t have clean solutions.
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
              <Link
                href="/essays"
                className="text-sm transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                View all →
              </Link>
            </div>

            <div className="space-y-6">
              {posts.slice(0, 3).map((post) => (
                <article key={post.slug} className="space-y-2">
                  <Link href={`/essays/${post.slug}`} className="block group">
                    <h3
                      className="text-lg font-medium transition-colors"
                      style={{ color: "var(--heading-color)" }}
                    >
                      {post.title}
                    </h3>
                    <p
                      className="leading-relaxed text-sm"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {post.description}
                    </p>
                    <time
                      className="text-xs"
                      style={{ color: "var(--text-light)" }}
                    >
                      {post.date}
                    </time>
                  </Link>
                </article>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div
            className="space-y-6 pt-10 border-t"
            style={{ borderColor: "var(--border-color)" }}
          >
            <h2
              className="text-lg font-medium"
              style={{ color: "var(--heading-color)" }}
            >
              Connect
            </h2>

            <div
              className="space-y-3"
              style={{ color: "var(--text-secondary)" }}
            >
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
      </div>
    </div>
  );
}
