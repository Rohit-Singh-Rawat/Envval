interface HeadingProps {
	title: string;
	description?: string;
}

export function Heading({ title, description }: HeadingProps) {
	return (
		<div className="flex flex-col gap-1">
			<h1>{title}</h1>
			{description && (
				<p className="text-sm text-muted-foreground">{description}</p>
			)}
		</div>
	);
}
