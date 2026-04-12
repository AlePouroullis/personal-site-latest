import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { getAllCollections } from "@/lib/photos";

export const baseUrl = "https://alepouroullis.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const collections = await getAllCollections();

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/essays`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/photography`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ];

  const essayPages = posts.map((post) => ({
    url: `${baseUrl}/essays/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  const collectionPages = collections.map((c) => ({
    url: `${baseUrl}/photography/${c.slug}`,
    lastModified: c.date,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...essayPages, ...collectionPages];
}
