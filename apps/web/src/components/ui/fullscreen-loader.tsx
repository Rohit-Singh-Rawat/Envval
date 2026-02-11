import { Spinner } from '@envval/ui/components/icons/spinner';

type FullscreenLoaderProps = {
	active: boolean;
	label?: string;
};

/**
 * Simple, CSS-only fullscreen loader using opacity transitions.
 * Route code controls when it's active; we just animate in/out.
 */
export function FullscreenLoader({ active, label = 'Loading' }: FullscreenLoaderProps) {
	return (
		<div
			className={[
				'fixed inset-0 z-80 flex items-center justify-center bg-transparent backdrop-blur-sm',
				'transition-opacity duration-300 ease-out',
				active ? 'opacity-100  pointer-events-auto' : 'opacity-0 pointer-events-none',
			].join(' ')}
			role={active ? 'status' : undefined}
			aria-live={active ? 'polite' : undefined}
			aria-label={active ? label : undefined}
			aria-hidden={!active}
		>
			<Spinner className='size-5 text-muted-foreground' />
			<span className='sr-only'>{label}</span>
		</div>
	);
}
