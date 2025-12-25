import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import PostList from "@/components/PostList";
import React from "react";

export default async function EssaysPage() {
  const posts = await getAllPosts();

  return (
    <div className="space-y-10">
      {/* Navigation */}
      <div>
        <Link href="/">← Home</Link>
      </div>
      {/* Header */}
      <div className="space-y-4">
        <h1
          className="text-3xl font-medium"
          style={{ color: "var(--heading-color)" }}
        >
          Essays
        </h1>
        <p
          className="leading-relaxed"
          style={{ color: "var(--text-tertiary)" }}
        >
          Thoughts on career, ambition, philosophy, and some other stuff.
        </p>
      </div>
      {/* Essays List */}
      <PostList posts={posts} />
    </div>
  );
}
