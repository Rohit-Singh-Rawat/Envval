import { useState } from 'react';
import { EnvvalLogo } from '../logo/envval';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
	{ label: 'Features', href: '/' },
	{ label: 'Pricing', href: '/' },
	{ label: 'Blog', href: '/' },
];

const Header = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<header className='sticky top-0 z-50 bg-background backdrop-blur-md '>
			<div className='flex items-center justify-between px-6 py-4 container max-w-7xl mx-auto'>
				<div className='flex items-center'>
					<EnvvalLogo
						variant='full'
						className='h-7 w-auto'
					/>
				</div>

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
					<a
						href='https://chrome.google.com/webstore/dummy'
						target='_blank'
						rel='noopener noreferrer'
						className={cn(buttonVariants({ size: 'sm' }))}
					>
						Download
					</a>
				</div>

				<button
					className='md:hidden p-2'
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					aria-label='Toggle menu'
				>
					{isMenuOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
				</button>

				{isMenuOpen && (
					<div className='absolute top-16 left-0 right-0 bg-background border-b md:hidden z-50'>
						<nav className='flex flex-col px-6 py-4 gap-4'>
							<Link
								to='/'
								className='text-sm font-medium hover:text-primary transition-colors'
							>
								Features
							</Link>
							<Link
								to='/'
								className='text-sm font-medium hover:text-primary transition-colors'
							>
								Pricing
							</Link>
							<Link
								to='/'
								className='text-sm font-medium hover:text-primary transition-colors'
							>
								Blog
							</Link>
							<div className='flex flex-col gap-2 pt-4 border-t'>
								<Link
									to='/login'
									className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
								>
									Login
								</Link>
								<a
									href='https://chrome.google.com/webstore/dummy'
									target='_blank'
									rel='noopener noreferrer'
									className={cn(buttonVariants({ size: 'sm' }))}
								>
									Download
								</a>
							</div>
						</nav>
					</div>
				)}
			</div>
		</header>
	);
};

export default Header;
