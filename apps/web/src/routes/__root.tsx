import {
	HeadContent,
	Scripts,
	createRootRouteWithContext,
	useRouterState,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools';

import appCss from '@/styles/styles.css?url';
import { Toaster } from '@envval/ui/components/sonner';

import type { QueryClient } from '@tanstack/react-query';

import { defaultMetadata } from '@/config/seo';
import { NotFoundPage } from '@/components/static/not-found';
import { FullscreenLoader } from '@/components/ui/fullscreen-loader';

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	notFoundComponent: NotFoundPage,
	head: () => ({
		meta: defaultMetadata,
		links: [
			{
				rel: 'stylesheet',
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function GlobalLoader() {
	const { isLoading } = useRouterState({
		select: (state) => ({ isLoading: state.isLoading }),
	});

	return <FullscreenLoader active={isLoading} label='Loading' />;
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang='en'>
			<head>
				<HeadContent />
			</head>
			<body>
				<GlobalLoader />
				{children}
				<Toaster position='bottom-center' />
				<TanStackDevtools
					config={{
						position: 'bottom-right',
					}}
					plugins={[
						{
							name: 'Tanstack Router',
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
