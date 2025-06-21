import fs from "fs";
import path from "path";

const postsDirectory = path.join(process.cwd(), "src/content/posts");

export interface PostMetadata {
  slug: string;
  title: string;
  date: Date;
  excerpt: string;
  readingTime: number;
}

function calculateReadingTime(content: string): number {
  // Remove MDX/JSX syntax and metadata export
  const cleanContent = content
    .replace(/export const metadata = {[\s\S]*?};/, "") // Remove metadata export
    .replace(/<[^>]*>/g, "") // Remove HTML/JSX tags
    .replace(/\{[^}]*\}/g, "") // Remove JSX expressions
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/`[^`]*`/g, "") // Remove inline code
    .trim();

  const wordsPerMinute = 200; // Average reading speed
  const words = cleanContent
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute)); // Minimum 1 minute
}

export async function getAllPosts(): Promise<PostMetadata[]> {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = await Promise.all(
    fileNames
      .filter(
        (fileName) => fileName.endsWith(".mdx") && !fileName.startsWith("_")
      )
      .map(async (fileName) => {
        const slug = fileName.replace(/\.mdx$/, "");

        try {
          // Read the file content for reading time calculation
          const fullPath = path.join(postsDirectory, fileName);
          const fileContent = fs.readFileSync(fullPath, "utf8");

          // Dynamically import the MDX file to get its metadata export
          const { metadata } = await import(`@/content/posts/${slug}.mdx`);

          return {
            slug,
            title: metadata.title,
            date: new Date(metadata.date),
            excerpt: metadata.excerpt,
            readingTime: calculateReadingTime(fileContent),
          };
        } catch (error) {
          console.error(`Error loading metadata for ${slug}:`, error);
          return null;
        }
      })
  );

  // Filter out any failed imports and sort by date
  return allPostsData
    .filter((post): post is PostMetadata => post !== null)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}
