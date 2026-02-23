import Footer from "../home/footer";
import Header from "../home/header";

type BlogMetadata = {
  title: string;
  subtitle?: string;
  publishedAt: string;
  readingTime: string;
  author: {
    name: string;
    avatar?: string;
  };
  coverImage?: string;
};

type BlogLayoutProps = {
  metadata: BlogMetadata;
  children: React.ReactNode;
};

export function BlogLayout({ metadata, children }: BlogLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="relative">
        <header className="max-w-2xl mx-auto px-6 pt-16 pb-10 md:pt-24 md:pb-14">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight mb-4">
            {metadata.title}
          </h1>

          {metadata.subtitle && (
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {metadata.subtitle}
            </p>
          )}

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {metadata.author.avatar ? (
              <img
                src={metadata.author.avatar}
                alt={metadata.author.name}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                {metadata.author.name.charAt(0)}
              </div>
            )}
            <span>{metadata.author.name}</span>
            <span className="text-muted-foreground/40">·</span>
            <time dateTime={metadata.publishedAt}>
              {formatDate(metadata.publishedAt)}
            </time>
            <span className="text-muted-foreground/40">·</span>
            <span>{metadata.readingTime}</span>
          </div>
        </header>

        {metadata.coverImage && (
          <div className="max-w-3xl mx-auto px-6 mb-12">
            <img
              src={metadata.coverImage}
              alt={metadata.title}
              className="w-full rounded-lg"
            />
          </div>
        )}

        <article className="max-w-2xl mx-auto px-6 pb-20">{children}</article>
      </main>

      <Footer />
    </div>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default BlogLayout;
