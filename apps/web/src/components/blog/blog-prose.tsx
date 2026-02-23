import { cn } from "@/lib/utils";

type ProseProps = {
  children: React.ReactNode;
  className?: string;
};

export function Prose({ children, className }: ProseProps) {
  return <div className={cn("mb-8", className)}>{children}</div>;
}

type ParagraphProps = {
  children: React.ReactNode;
  className?: string;
};

export function Paragraph({ children, className }: ParagraphProps) {
  return (
    <p className={cn("text-base leading-7 text-foreground/80 mb-5", className)}>
      {children}
    </p>
  );
}

type HeadingProps = {
  children: React.ReactNode;
  as?: "h2" | "h3";
  className?: string;
};

export function Heading({ children, as: Tag = "h2", className }: HeadingProps) {
  const styles = {
    h2: "text-xl font-semibold mt-12 mb-4",
    h3: "text-lg font-semibold mt-8 mb-3",
  };

  return <Tag className={cn(styles[Tag], className)}>{children}</Tag>;
}

type BlockquoteProps = {
  children: React.ReactNode;
};

export function Blockquote({ children }: BlockquoteProps) {
  return (
    <blockquote className="my-6 pl-4 border-l-2 border-muted-foreground/20">
      <p className="text-base italic text-foreground/70 leading-7">
        {children}
      </p>
    </blockquote>
  );
}

type ImageProps = {
  src: string;
  alt: string;
  caption?: string;
};

export function BlogImage({ src, alt, caption }: ImageProps) {
  return (
    <figure className="my-8">
      <img src={src} alt={alt} className="w-full rounded-lg" loading="lazy" />
      {caption && (
        <figcaption className="text-center text-sm text-muted-foreground mt-3">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

type HighlightBoxProps = {
  children: React.ReactNode;
  className?: string;
};

export function HighlightBox({ children, className }: HighlightBoxProps) {
  return (
    <div className={cn("my-6 p-5 rounded-lg bg-muted/40", className)}>
      {children}
    </div>
  );
}

type ListProps = {
  items: string[];
};

export function List({ items }: ListProps) {
  return (
    <ul className="my-5 pl-5 space-y-2 list-disc text-foreground/80">
      {items.map((item) => (
        <li key={item} className="leading-7">
          {item}
        </li>
      ))}
    </ul>
  );
}

type CodeBlockProps = {
  code: string;
  filename?: string;
};

export function CodeBlock({ code, filename }: CodeBlockProps) {
  return (
    <div className="my-6">
      {filename && (
        <span className="text-xs text-muted-foreground">{filename}</span>
      )}
      <pre className="mt-1 p-4 rounded-lg bg-muted/40 overflow-x-auto">
        <code className="text-sm font-mono text-foreground/80">{code}</code>
      </pre>
    </div>
  );
}

export function Divider() {
  return <hr className="my-10 border-border/40" />;
}
