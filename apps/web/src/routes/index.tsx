import { createFileRoute } from '@tanstack/react-router';
import Home from '../components/home/home';
import { homePageMiddleware } from '@/middleware/auth';
export const Route = createFileRoute('/')({
	component: App,
	server: {
		middleware: [homePageMiddleware],
	},
	pendingComponent: () => <Home />,
});

function App() {
	return <Home />;
}
