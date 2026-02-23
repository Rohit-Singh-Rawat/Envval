import { createFileRoute, Link } from "@tanstack/react-router";
import { FooterWithoutCTA as Footer } from "@/components/home/footer";
import Header from "@/components/home/header";
import { siteConfig } from "@/config/seo";

export const Route = createFileRoute("/blog/")({
	component: BlogIndex,
	head: () => ({
		meta: [
			{ title: `Blog - ${siteConfig.name}` },
			{
				name: "description",
				content: "Insights, updates, and stories from the Envval team.",
			},
			{ property: "og:title", content: `Blog - ${siteConfig.name}` },
			{
				property: "og:description",
				content: "Insights, updates, and stories from the Envval team.",
			},
		],
	}),
});

type BlogPost = {
	slug: string;
	title: string;
	description: string;
	publishedAt: string;
	coverImage: string;
};

const posts: BlogPost[] = [
	{
		slug: "introducing-envval",
		title: "Introducing Envval",

		description:
			"After building countless projects, I finally decided to fix the one problem that kept haunting me. Lost and scattered environment variables.",
		publishedAt: "2026-02-11",
		coverImage: "/images/blog/introducing-envval/cover.png",
	},
];

function BlogIndex() {
	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main className="max-w-5xl mx-auto px-6 py-20 md:py-32">
				<h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-3">
					Blog
				</h1>
				<p className="text-muted-foreground mb-16">
					Stories and updates from building Envval.
				</p>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
					{posts.map((post) => (
						<BlogPostCard key={post.slug} post={post} />
					))}
				</div>
			</main>

			<Footer />
		</div>
	);
}

function BlogPostCard({ post }: { post: BlogPost }) {
	return (
		<article>
			<Link to="/blog/introducing-envval" className="block">
				<div className="aspect-[3/2] rounded-lg overflow-hidden bg-muted/50 mb-4">
					<img
						src={post.coverImage}
						alt={post.title}
						className="w-full h-full object-cover"
						loading="lazy"
					/>
				</div>

				<time
					dateTime={post.publishedAt}
					className="text-xs text-muted-foreground/60"
				>
					{formatDate(post.publishedAt)}
				</time>

				<h2 className="text-base font-semibold mt-1.5 mb-1.5">{post.title}</h2>

				<p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
					{post.description}
				</p>
			</Link>
		</article>
	);
}

function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}
