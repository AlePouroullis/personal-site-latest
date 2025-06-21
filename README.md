# Personal Blog

A clean, minimal blog built with Next.js 15, MDX, and Tailwind CSS.

## How it works

### Content Structure
- **Posts**: Write MDX files in `src/content/posts/`
- **Template**: Use `_template.mdx` as starting point for new posts
- **Metadata**: Export metadata object from each MDX file (no YAML frontmatter)

```mdx
export const metadata = {
  title: "Your Post Title",
  date: "2025-06-21", 
  excerpt: "Brief description of the post...",
  tags: ["tag1", "tag2"]
};

Your content starts here...
```

### Key Files

**Core Pages**
- `app/page.tsx` - Homepage with bio and recent posts
- `app/essays/page.tsx` - All essays listing
- `app/essays/[slug]/page.tsx` - Individual essay pages

**Content Management**
- `lib/posts.ts` - Loads all posts, calculates reading time
- `components/PostList.tsx` - Displays post listings with hover effects

**Styling**
- `globals.css` - Typography, colors, and base styles
- `PostList.module.css` - Component-specific hover effects

### Features

- **Responsive typography**: 20px desktop, 18px mobile
- **Reading time**: Auto-calculated from content
- **RSS feed**: Available at `/rss`
- **SEO optimized**: Sitemap, robots.txt, OpenGraph
- **Clean design**: Focused on readability

### Adding a new post

1. Copy `_template.mdx` to new file: `your-post-slug.mdx`
2. Update metadata (title, date, excerpt, tags)
3. Write your content using markdown/MDX
4. Deploy - posts auto-appear on homepage and essays page

### Design System

- **Content width**: 650px for optimal readability
- **Colors**: Charcoal theme with burnt orange accents
- **Fonts**: Crimson Text (body), Inter (headings)
- **Layout**: Centralized in root layout, consistent spacing

### Tech Stack

- Next.js 15 (App Router)
- MDX for content
- Tailwind CSS + Typography plugin
- TypeScript
- Vercel Analytics & Speed Insights

## Development

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run start  # Run production build
```

## Notes

- All posts are statically generated at build time
- Reading time calculated from word count (200 WPM)
- No external CMS - just MDX files in the repo
- RSS feed updates automatically when posts are added
