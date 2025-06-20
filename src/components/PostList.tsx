import Link from "next/link";
import { PostMetadata } from "@/lib/posts";

interface PostListProps {
  posts: PostMetadata[];
  limit?: number;
  variant?: "compact" | "full";
  showEmptyState?: boolean;
  emptyStateMessage?: string;
}

export default function PostList({
  posts,
  limit,
  variant = "compact",
  showEmptyState = true,
}: PostListProps) {
  const displayPosts = limit ? posts.slice(0, limit) : posts;

  if (posts.length === 0 && showEmptyState) {
    return (
      <div>
        <p style={{ color: "var(--text-tertiary)" }}>
          I&apos;ll get around to it, eventually...
        </p>
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className="space-y-8">
        {displayPosts.map((post) => (
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
              <time className="text-sm" style={{ color: "var(--text-light)" }}>
                {post.date}
              </time>
            </Link>
          </article>
        ))}
      </div>
    );
  }

  // Compact variant (default)
  return (
    <div className="space-y-6">
      {displayPosts.map((post) => (
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
            <time className="text-xs" style={{ color: "var(--text-light)" }}>
              {post.date}
            </time>
          </Link>
        </article>
      ))}
    </div>
  );
}
