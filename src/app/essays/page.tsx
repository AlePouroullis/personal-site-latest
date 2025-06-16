import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function EssaysPage() {
  const posts = getAllPosts();

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--bg-primary)",
        backgroundImage: "var(--paper-texture)",
        backgroundSize: "20px 20px",
      }}
    >
      <div className="max-w-2xl mx-auto px-8 py-16">
        {/* Navigation */}
        <div className="mb-10">
          <Link
            href="/"
            className="transition-colors text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            ← Home
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12">
          <h1
            className="text-3xl font-medium mb-4"
            style={{ color: "var(--heading-color)" }}
          >
            Essays
          </h1>
          <p
            className="leading-relaxed"
            style={{ color: "var(--text-tertiary)" }}
          >
            Thoughts on building software, navigating uncertainty, and the
            spaces between disciplines.
          </p>
        </div>

        {/* Essays List */}
        <div className="space-y-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="border-b pb-8 last:border-b-0"
              style={{ borderColor: "var(--border-color)" }}
            >
              <Link href={`/essays/${post.slug}`} className="block group">
                <h2
                  className="text-xl font-medium transition-colors mb-3"
                  style={{ color: "var(--heading-color)" }}
                >
                  {post.title}
                </h2>
                <p
                  className="leading-relaxed mb-3"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {post.description}
                </p>
                <time
                  className="text-sm"
                  style={{ color: "var(--text-light)" }}
                >
                  {post.date}
                </time>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
