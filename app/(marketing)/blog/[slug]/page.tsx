// @ts-nocheck
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchBlogPosts, type BlogPost } from "@/lib/blog-data";
import { BreadcrumbSchema, FAQSchema } from "@/components/shared/StructuredData";
import BlogContent from "@/components/blog/BlogContent";
import BlogComments from "@/components/blog/BlogComments";

interface Props {
  params: { slug: string };
  searchParams?: { preview?: string };
}

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await fetchBlogPosts(true);
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const posts = await fetchBlogPosts(true);
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.description, type: "article", url: `/blog/${post.slug}` },
  };
}

function PostContent({ post }: { post: BlogPost }) {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Blog", url: "/blog" }, { name: post.title, url: `/blog/${post.slug}` }]} />
      <FAQSchema faqs={post.faqs} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            author: { "@type": "Organization", name: "genxdigitizing" },
          }),
        }}
      />
      <BlogContent post={post}>
        <BlogComments slug={post.slug} />
      </BlogContent>
    </>
  );
}

export default async function BlogPostPage({ params, searchParams }: Props) {
  const isPreview = searchParams?.preview === "true";
  const posts = await fetchBlogPosts(!isPreview);
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) notFound();
  return <PostContent post={post} />;
}
