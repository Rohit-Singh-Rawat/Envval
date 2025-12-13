import { createFileRoute, Outlet } from '@tanstack/react-router';
import { redirectIfAuthenticatedMiddleware } from '@/middleware/auth';

export const Route = createFileRoute('/_auth')({
	server: {
		middleware: [redirectIfAuthenticatedMiddleware],
	},
	component: RouteComponent,
});
function RouteComponent() {
	return <Outlet />;
}
