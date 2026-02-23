import { buttonVariants } from "@envval/ui/components/button";
import { Link } from "@tanstack/react-router";
import {
	AnimatePresence,
	motion,
	type SVGMotionProps,
	type Transition,
	type Variants,
} from "motion/react";
import { useId, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { EXTENSION_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { EnvvalLogo } from "../logo/envval";

/** Marketing nav link; href is a path or hash. */
interface NavItem {
	readonly label: string;
	readonly href: string;
}

interface MenuToggleProps {
	isOpen: boolean;
	toggle: () => void;
	menuId: string;
}

interface MobileMenuProps {
	isOpen: boolean;
	onClose: () => void;
	isLoggedIn: boolean;
	menuId: string;
}

/** Desktop: compact button; mobile: full-width block. onNavigate used to close mobile menu. */
interface AuthNavLinkProps {
	isLoggedIn: boolean;
	variant: "desktop" | "mobile";
	onNavigate?: () => void;
}

const NAV_ITEMS: readonly NavItem[] = [
	{ label: "Features", href: "/#features" },
	{ label: "FAQ", href: "/#faq" },
	{ label: "Blog", href: "/blog" },
] as const;

const AUTH_LINK_TRANSITION: Transition = {
	duration: 0.25,
	ease: "easeInOut",
};

const HEADER_TRANSITION: Transition = {
	duration: 0.3,
	ease: "easeInOut",
};

const Path = (props: SVGMotionProps<SVGPathElement>) => (
	<motion.path
		fill="transparent"
		strokeWidth="3"
		stroke="currentColor"
		strokeLinecap="round"
		{...props}
	/>
);

const MenuToggle = ({ isOpen, toggle, menuId }: MenuToggleProps) => (
	<button
		type="button"
		onClick={toggle}
		className="md:hidden stroke-1 p-2 z-50 relative outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md text-foreground"
		aria-label={isOpen ? "Close menu" : "Open menu"}
		aria-expanded={isOpen}
		aria-controls={menuId}
	>
		<svg width="23" height="23" viewBox="0 0 23 23" aria-hidden={true}>
			<Path
				variants={{
					closed: { d: "M 2 2.5 L 20 2.5" },
					open: { d: "M 3 16.5 L 17 2.5" },
				}}
				strokeWidth="1"
				initial="closed"
				animate={isOpen ? "open" : "closed"}
				transition={HEADER_TRANSITION}
			/>
			<Path
				d="M 2 9.423 L 20 9.423"
				variants={{
					closed: { opacity: 1 },
					open: { opacity: 0 },
				}}
				strokeWidth="1"
				initial="closed"
				animate={isOpen ? "open" : "closed"}
				transition={{ duration: 0.1, ease: "easeInOut" }}
			/>
			<Path
				variants={{
					closed: { d: "M 2 16.346 L 20 16.346" },
					open: { d: "M 3 2.5 L 17 16.346" },
				}}
				strokeWidth="1"
				initial="closed"
				animate={isOpen ? "open" : "closed"}
				transition={HEADER_TRANSITION}
			/>
		</svg>
	</button>
);

const menuVariants: Variants = {
	closed: {
		opacity: 0,
		height: 0,
		transition: {
			staggerChildren: 0.02,
			staggerDirection: -1,
			when: "afterChildren",
			ease: "easeInOut",
			duration: 0.35,
		},
	},
	open: {
		opacity: 1,
		height: "auto",
		transition: {
			staggerChildren: 0.07,
			delayChildren: 0.2,
			ease: "easeInOut",
			duration: 0.3,
		},
	},
};

const itemVariants: Variants = {
	closed: { opacity: 0, y: -10, filter: "blur(4px)" },
	open: { opacity: 1, y: 0, filter: "blur(0px)" },
};

/**
 * Session-aware Login / Dashboard link with crossfade. Uses mode='wait' and initial={false}
 * so the first paint doesn't animate and the outgoing link exits before the new one enters
 * when session state resolves (avoids flash and overlap).
 */
function AuthNavLink({ isLoggedIn, variant, onNavigate }: AuthNavLinkProps) {
	const isMobile = variant === "mobile";
	const linkClass = isMobile
		? cn(
				buttonVariants({ variant: "ghost", size: "sm" }),
				"w-full justify-start",
			)
		: buttonVariants({ variant: "ghost", size: "sm" });
	const wrapperClass = isMobile
		? "absolute inset-0 flex items-center"
		: "absolute inset-0 flex items-center justify-center";

	return (
		<AnimatePresence mode="wait" initial={false}>
			{isLoggedIn ? (
				<motion.div
					key="dashboard"
					initial={{ opacity: 0, y: 4 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -4 }}
					transition={AUTH_LINK_TRANSITION}
					className={wrapperClass}
				>
					<Link
						to="/dashboard"
						className={linkClass}
						onClick={onNavigate}
						aria-label="Go to dashboard"
					>
						Dashboard
					</Link>
				</motion.div>
			) : (
				<motion.div
					key="login"
					initial={{ opacity: 0, y: 4 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -4 }}
					transition={AUTH_LINK_TRANSITION}
					className={wrapperClass}
				>
					<Link
						to="/login"
						className={linkClass}
						onClick={onNavigate}
						aria-label="Log in"
					>
						Login
					</Link>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

function MobileMenu({ isOpen, onClose, isLoggedIn, menuId }: MobileMenuProps) {
	return (
		<AnimatePresence mode="sync">
			{isOpen && (
				<motion.div
					initial="closed"
					animate="open"
					exit="closed"
					variants={menuVariants}
					id={menuId}
					className="absolute top-16 left-0 right-0 bg-background border-b md:hidden z-50 overflow-hidden"
				>
					<nav className="flex flex-col px-6 py-4 gap-4" aria-label="Main menu">
						{NAV_ITEMS.map((item) => (
							<motion.div key={item.label} variants={itemVariants}>
								<Link
									to={item.href}
									className="text-sm font-medium hover:text-primary transition-colors block py-2"
									onClick={onClose}
								>
									{item.label}
								</Link>
							</motion.div>
						))}
						<motion.div
							variants={itemVariants}
							className="flex flex-col gap-2 pt-4 border-t border-border/50"
						>
							<div className="relative min-h-9 flex items-center">
								<AuthNavLink
									isLoggedIn={isLoggedIn}
									variant="mobile"
									onNavigate={onClose}
								/>
							</div>
							<Link
								to={EXTENSION_URL}
								className={cn(buttonVariants({ size: "sm" }), "w-full")}
								onClick={onClose}
							>
								Download
							</Link>
						</motion.div>
					</nav>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

function Header() {
	const menuId = useId();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const { data: session } = useSession();
	const isLoggedIn = Boolean(session?.user);

	const closeMenu = () => setIsMenuOpen(false);
	const toggleMenu = () => setIsMenuOpen((prev) => !prev);

	return (
		<motion.header
			className="sticky top-0 z-50 bg-background backdrop-blur-md"
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={HEADER_TRANSITION}
		>
			<div className="flex items-center justify-between px-4 sm:px-6 py-4 container max-w-7xl mx-auto">
				<Link to="/" aria-label="EnvVal Home">
					<EnvvalLogo variant="full" className="h-7 w-auto" />
				</Link>

				<nav
					className="hidden md:flex items-center gap-4"
					aria-label="Primary navigation"
				>
					{NAV_ITEMS.map((item) => (
						<Link
							key={item.label}
							to={item.href}
							className="relative text-sm font-normal hover:text-primary transition-colors px-3 py-2"
						>
							<span className="relative z-10">{item.label}</span>
						</Link>
					))}
				</nav>

				<div className="hidden md:flex items-center gap-4">
					<div className="relative h-9 min-w-22 flex justify-center">
						<AuthNavLink isLoggedIn={isLoggedIn} variant="desktop" />
					</div>
					<Link
						to={EXTENSION_URL}
						className={cn(buttonVariants({ size: "sm" }), "group")}
					>
						<span className="inline-flex items-center gap-2 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] [text-shadow:0_-2lh_currentColor] group-hover:translate-y-[2lh]">
							Download
						</span>
					</Link>
				</div>

				<MenuToggle isOpen={isMenuOpen} toggle={toggleMenu} menuId={menuId} />
				<MobileMenu
					isOpen={isMenuOpen}
					onClose={closeMenu}
					isLoggedIn={isLoggedIn}
					menuId={menuId}
				/>
			</div>
		</motion.header>
	);
}

export default Header;
