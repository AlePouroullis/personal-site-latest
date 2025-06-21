import Link from "next/link";
import { PostMetadata } from "@/lib/posts";
import styles from "./PostList.module.css";

interface PostListProps {
  posts: PostMetadata[];
  limit?: number;
}

export default function PostList({ posts, limit }: PostListProps) {
  const displayPosts = limit ? posts.slice(0, limit) : posts;

  if (posts.length === 0) {
    return (
      <div>
        <p style={{ color: "var(--text-tertiary)" }}>
          I&apos;ll get around to it, eventually...
        </p>
      </div>
  );
  }

  return (
    <div className="space-y-8">
      {displayPosts.map((post) => (
        <article key={post.slug}>
          <Link
            href={`/essays/${post.slug}`}
            className={styles.postLink}
          >
            <h3
              className="text-xl transition-opacity"
              style={{ 
                color: "var(--heading-color)",
                fontWeight: 600,
                marginBottom: "0.5rem"
              }}
            >
              {post.title}
            </h3>
            
            <p
              className="font-light"
              style={{ 
                color: "var(--text-muted)",
                marginBottom: "0.75rem"
              }}
            >
              {post.excerpt}
            </p>
            
            <time 
              className="text-sm"
              style={{ 
                color: "var(--text-light)",
                fontWeight: 500
              }}
            >
              {post.date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </time>
          </Link>
        </article>
      ))}
    </div>
  );
}