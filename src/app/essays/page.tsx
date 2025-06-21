import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import PostList from "@/components/PostList";
import React from "react";

export default async function EssaysPage() {
  const posts = await getAllPosts();

  return (
    <>
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
          Thoughts on career, ambition, philosophy, and some other stuff.
        </p>
      </div>
      {/* Essays List */}
      <PostList posts={posts} />
    </>
  );
}
