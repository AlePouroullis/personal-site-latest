import { getPostSlugs } from '@/lib/posts'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ComponentType } from 'react'

interface PostPageProps {
  params: { slug: string }
}

// Dynamic imports for MDX files
const importPost = async (slug: string): Promise<ComponentType | null> => {
  try {
    const module = await import(`../../../../content/essays/${slug}.mdx`)
    return module.default
  } catch {
    return null
  }
}

export async function generateStaticParams() {
  const slugs = getPostSlugs()
  return slugs.map((slug) => ({
    slug,
  }))
}

export default async function PostPage({ params }: PostPageProps) {
  const PostComponent = await importPost(params.slug)

  if (!PostComponent) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-2xl mx-auto px-8 py-16">
        <div className="mb-10">
          <Link href="/" className="text-amber-600 hover:text-amber-800 transition-colors text-sm">
            ← Back to home
          </Link>
        </div>
        
        <article className="prose prose-amber prose-lg max-w-none">
          <PostComponent />
        </article>
      </div>
    </div>
  )
}