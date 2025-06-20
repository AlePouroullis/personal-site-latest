import { getAllPosts } from "@/lib/posts";
import Link from "next/link";

export async function generateStaticParams() {
  const posts = getAllPosts();

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
  const { default: Post } = await import(`@/content/${slug}.mdx`);

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-2xl mx-auto px-8 py-16">
        <div className="mb-10">
          <Link
            href="/"
            className="text-amber-600 hover:text-amber-800 transition-colors text-sm"
          >
            ← Back to home
          </Link>
        </div>

        <article className="prose prose-amber prose-lg max-w-none">
          <Post />
        </article>
      </div>
    </div>
  );
}
