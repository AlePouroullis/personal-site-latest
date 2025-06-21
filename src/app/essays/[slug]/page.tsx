import { getAllPosts } from "@/lib/posts";
import Link from "next/link";

export async function generateStaticParams() {
  const posts = await getAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Accessing a route not defined in generateStaticParams will 404.
export const dynamicParams = false;

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { default: Post, metadata } = await import(
    `@/content/posts/${slug}.mdx`
  );

  // Get reading time from posts data
  const posts = await getAllPosts();
  const currentPost = posts.find((post) => post.slug === slug);
  const readingTime = currentPost?.readingTime || 1;

  const date = new Date(metadata.date);

  return (
    <>
      <div className="mb-10">
        <Link href="/essays" className="text-sm transition-colors">
          ← Essays
        </Link>
      </div>
      <article className="prose prose-amber prose-lg max-w-none">
        <header className="mb-8">
          <h1>{metadata.title}</h1>
          <div className="flex items-center gap-2 text-sm">
            <time
            className="font-light"
              style={{
                color: "var(--text-light)",
                fontWeight: 500,
              }}
            >
              {date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
            <span>•</span>
            <span>{readingTime} min read</span>
          </div>
        </header>
        <Post />
      </article>
    </>
  );
}
