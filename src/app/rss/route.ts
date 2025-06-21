import { getAllPosts } from "@/lib/posts";

const baseUrl = "https://alepouroullis.com";

export async function GET() {
  const posts = await getAllPosts();

  const itemsXml = posts
    .sort((a, b) => {
      if (new Date(a.date) > new Date(b.date)) {
        return -1;
      }
      return 1;
    })
    .map(
      (post) =>
        `<item>
          <title>${post.title}</title>
          <link>${baseUrl}/essays/${post.slug}</link>
          <description>${post.excerpt || ""}</description>
          <pubDate>${new Date(post.date).toUTCString()}</pubDate>
          <guid>${baseUrl}/essays/${post.slug}</guid>
        </item>`
    )
    .join("\n");

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Alé Pouroullis - Essays</title>
    <link>${baseUrl}</link>
    <description>Essays on career, ambition, philosophy, and other thoughts by Alé Pouroullis</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`;

  return new Response(rssFeed, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
