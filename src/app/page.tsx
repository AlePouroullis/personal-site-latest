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
                I&apos;m a software engineer (and chronic overthinker) living in
                London. Not entirely sure what I&apos;m doing — but I keep moving. 
                These days, I&apos;m a product engineer at <a href="https://humanloop.com" target="_blank" rel="noopener">Humanloop</a>{" "}
                where we&apos;re trying to make AI a little more grounded in reality.
              </p>

              <p style={{ color: "var(--text-secondary)" }}>
                In my previous life, I studied Computer Science at the University of Cape Town,
                where I mostly spent my time at the beach (ah, the good old days).
                Somewhere in there, I helped build a mobility startup called Loop (can&apos;t seem to escape the loop)
                where we tried to untangle the taxi industry in South Africa.
              </p>

              <p style={{ color: "var(--text-tertiary)" }}>
                And in the life before that, I made music. I&apos;m mostly a listener now, and each year, I tell myself the same thing:
                I&apos;ll return to it... but alas, the capitalist machine leads one astray. Or I&apos;m just lazy.
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
