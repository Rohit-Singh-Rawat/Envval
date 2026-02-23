import { Button, buttonVariants } from "@envval/ui/components/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { EnvvalLogo } from "@/components/logo/envval";

export function NotFoundPage() {
	const navigate = useNavigate();

	const goBack = () => {
		// Prefer browser back if possible, otherwise send home.
		if (typeof window !== "undefined" && window.history.length > 1) {
			window.history.back();
			return;
		}
		navigate({ to: "/" });
	};

	return (
		<div className="min-h-screen bg-background flex items-center justify-center px-4">
			<main className="w-full max-w-md" aria-labelledby="not-found-title">
				<div className="flex items-center justify-between">
					<EnvvalLogo width={28} height={28} className="text-foreground" />
					<span className="text-xs rounded-full bg-muted/40 px-2 py-1 text-muted-foreground">
						404
					</span>
				</div>

				<div className="mt-6 space-y-2">
					<h1
						id="not-found-title"
						className="text-xl font-semibold tracking-tight"
					>
						Page not found
					</h1>
					<p className="text-sm text-muted-foreground">
						The page you’re looking for doesn’t exist (or it moved).
					</p>
				</div>

				<div className="mt-6 flex items-center gap-3">
					<Link to="/" className={buttonVariants({ size: "sm" })}>
						Go home
					</Link>
					<Button type="button" size="sm" variant="muted" onClick={goBack}>
						Go back
					</Button>
				</div>

				<div className="mt-6 text-xs text-muted-foreground">
					Try the{" "}
					<Link
						to="/"
						className="underline underline-offset-4 hover:text-foreground"
					>
						homepage
					</Link>{" "}
					or head to{" "}
					<Link
						to="/blog"
						className="underline underline-offset-4 hover:text-foreground"
					>
						blog
					</Link>
					.
				</div>
			</main>
		</div>
	);
}
