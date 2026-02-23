import { createFileRoute } from "@tanstack/react-router";
import { homePageMiddleware } from "@/middleware/auth";
import Home from "../components/home/home";
export const Route = createFileRoute("/")({
	component: App,
	server: {
		middleware: [homePageMiddleware],
	},
	pendingComponent: () => <Home />,
});

function App() {
	return <Home />;
}
