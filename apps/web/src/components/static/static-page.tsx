import Header from '../home/header';
import { FooterWithoutCTA as Footer } from '../home/footer';

type StaticPageProps = {
	title: string;
	subtitle?: string;
	lastUpdated?: string;
	children: React.ReactNode;
};

export function StaticPage({ title, subtitle, lastUpdated, children }: StaticPageProps) {
	return (
		<div className='min-h-screen bg-background'>
			<Header />

			<main className='max-w-2xl mx-auto px-6 py-16 md:py-24'>
				<header className='mb-12'>
					<h1 className='text-2xl md:text-3xl font-semibold tracking-tight mb-2'>
						{title}
					</h1>
					{subtitle && (
						<p className='text-muted-foreground'>{subtitle}</p>
					)}
					{lastUpdated && (
						<p className='text-xs text-muted-foreground/50 mt-2'>
							Last updated: {lastUpdated}
						</p>
					)}
				</header>

				<div className='static-content space-y-6 text-base leading-8 text-foreground/80 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-foreground [&_strong]:text-foreground [&_strong]:font-medium'>
					{children}
				</div>
			</main>

			<Footer />
		</div>
	);
}
