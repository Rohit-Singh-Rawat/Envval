import { createFileRoute } from '@tanstack/react-router';
import Header from '@/components/home/header';
import Footer from '@/components/home/footer';

export const Route = createFileRoute('/extension')({
	component: ExtensionPage,
});

function ExtensionPage() {
	return (
		<>
			<Header />
			<section className='container max-w-7xl mx-auto px-6 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]'>
				<div className='flex flex-col items-center text-center max-w-2xl gap-6'>
					<span className='inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary'>
						<span className='size-1.5 rounded-full bg-primary animate-pulse' />
						Beta
					</span>

					<h1 className='text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] font-zodiak font-medium'>
						Extension<span className='text-primary'> coming soon</span>
					</h1>

					<p className='text-muted-foreground text-lg md:text-xl leading-snug max-w-lg text-shadow-2xs text-shadow-muted-foreground/10'>
						Our VS Code extension is currently in development. Pull, push, and rotate secrets
						without ever leaving your editor.
					</p>
				</div>
			</section>
			<Footer />
		</>
	);
}
