import { EXTENSION_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@envval/ui/components/button';
import { Link } from '@tanstack/react-router';
import { AnimatePresence, type SVGMotionProps, Variants, motion } from 'motion/react';
import { useState } from 'react';
import { EnvvalLogo } from '../logo/envval';

const navItems = [
	{ label: 'Features', href: '/#features' },
	{ label: 'FAQ', href: '/#faq' },
	{ label: 'Blog', href: '/blog' },
];

const Path = (props: SVGMotionProps<SVGPathElement>) => (
	<motion.path
		fill='transparent'
		strokeWidth='3'
		stroke='currentColor'
		strokeLinecap='round'
		{...props}
	/>
);

interface MenuToggleProps {
	isOpen: boolean;
	toggle: () => void;
}

const MenuToggle = ({ isOpen, toggle }: MenuToggleProps) => (
	<button
		onClick={toggle}
		className='md:hidden stroke-1 p-2 z-50 relative outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md text-foreground'
		aria-label={isOpen ? 'Close menu' : 'Open menu'}
		aria-expanded={isOpen}
		aria-controls='mobile-menu'
	>
		<svg
			width='23'
			height='23'
			viewBox='0 0 23 23'
		>
			<Path
				variants={{
					closed: { d: 'M 2 2.5 L 20 2.5' },
					open: { d: 'M 3 16.5 L 17 2.5' },
				}}
				strokeWidth='1'
				initial='closed'
				animate={isOpen ? 'open' : 'closed'}
				transition={{ duration: 0.3, ease: 'easeInOut' }}
			/>
			<Path
				d='M 2 9.423 L 20 9.423'
				variants={{
					closed: { opacity: 1 },
					open: { opacity: 0 },
				}}
				strokeWidth='1'
				initial='closed'
				animate={isOpen ? 'open' : 'closed'}
				transition={{ duration: 0.1, ease: 'easeInOut' }}
			/>
			<Path
				variants={{
					closed: { d: 'M 2 16.346 L 20 16.346' },
					open: { d: 'M 3 2.5 L 17 16.346' },
				}}
				strokeWidth='1'
				initial='closed'
				animate={isOpen ? 'open' : 'closed'}
				transition={{ duration: 0.3, ease: 'easeInOut' }}
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
			when: 'afterChildren',
			ease: 'easeInOut',
			duration: 0.35,
		},
	},
	open: {
		opacity: 1,
		height: 'auto',
		transition: {
			staggerChildren: 0.07,
			delayChildren: 0.2,
			ease: 'easeInOut',
			duration: 0.3,
		},
	},
};

const itemVariants: Variants = {
	closed: { opacity: 0, y: -10, filter: 'blur(4px)' },
	open: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

const MobileMenu = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
	<AnimatePresence mode='sync'>
		{isOpen && (
			<motion.div
				initial='closed'
				animate='open'
				exit='closed'
				variants={menuVariants}
				id='mobile-menu'
				className='absolute top-16 left-0 right-0 bg-background border-b md:hidden z-50 overflow-hidden '
			>
				<nav className='flex flex-col px-6 py-4 gap-4'>
					{navItems.map((item) => (
						<motion.div
							key={item.label}
							variants={itemVariants}
						>
							<Link
								to={item.href}
								className='text-sm font-medium hover:text-primary transition-colors block py-2'
								onClick={onClose}
							>
								{item.label}
							</Link>
						</motion.div>
					))}
					<motion.div
						variants={itemVariants}
						className='flex flex-col gap-2 pt-4 border-t border-border/50'
					>
						<Link
							to='/login'
							className={cn(
								buttonVariants({ variant: 'ghost', size: 'sm' }),
								'w-full justify-start'
							)}
							onClick={onClose}
						>
							Login
						</Link>
						<Link
							to={EXTENSION_URL}
							className={cn(buttonVariants({ size: 'sm' }), 'w-full')}
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

const Header = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<motion.header
			className='sticky top-0 z-50 bg-background backdrop-blur-md'
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: 'easeInOut' }}
		>
			<div className='flex items-center justify-between px-4 sm:px-6 py-4 container max-w-7xl mx-auto'>
				<Link
					to='/'
					aria-label='EnvVal Home'
				>
					<EnvvalLogo
						variant='full'
						className='h-7 w-auto'
					/>
				</Link>

				<nav className='hidden md:flex items-center gap-4'>
					{navItems.map((item) => (
						<Link
							key={item.label}
							to={item.href}
							className='relative text-sm font-normal hover:text-primary transition-colors px-3 py-2'
						>
							<span className='relative z-10'>{item.label}</span>
						</Link>
					))}
				</nav>

				<div className='hidden md:flex items-center gap-4'>
					<Link
						to='/login'
						className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
					>
						Login
					</Link>
					<Link
						to={EXTENSION_URL}
						className={cn(buttonVariants({ size: 'sm' }), 'group')}
					>
						<span className='inline-flex items-center gap-2 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] [text-shadow:0_-2lh_currentColor] group-hover:translate-y-[2lh]'>
							Download
						</span>
					</Link>
				</div>

				<MenuToggle
					isOpen={isMenuOpen}
					toggle={() => setIsMenuOpen(!isMenuOpen)}
				/>
				<MobileMenu
					isOpen={isMenuOpen}
					onClose={() => setIsMenuOpen(false)}
				/>
			</div>
		</motion.header>
	);
};

export default Header;
