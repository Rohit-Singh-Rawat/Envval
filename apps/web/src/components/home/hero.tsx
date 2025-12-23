import { Button } from '@/components/ui/button';

const HeroCTA = () => (
	<div className='flex flex-col items-center text-center max-w-3xl'>
		<h2 className='text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] mb-6 font-zodiak font-medium'>
			Manage your environment<span className='text-primary'> secrets</span> securely
		</h2>
		<p className='text-muted-foreground text-lg md:text-xl mb-10 leading-relaxed font-normal text-shadow-2xs text-shadow-muted-foreground/10'>
			We help teams sync, share, and manage environment variables across projects, without exposing
			sensitive data in your codebase.
		</p>
		<div className='flex items-center gap-4'>
			<Button
				size='lg'
				className='px-5'
				hoverAnimate={true}
			>
				Try for free
			</Button>
			<Button
				variant='ghost'
				size='lg'
				className='text-muted-foreground'
			>
				Get started
			</Button>
		</div>
	</div>
);

const HeroImage = () => (
	<div className='w-full max-w-7xl'>
		<div className='relative rounded-3xl overflow-hidden aspect-[3/4] md:aspect-video flex items-center justify-center shadow-2xs'>
			<svg
				className='absolute inset-0 w-full h-full -z-10'
				xmlns='http://www.w3.org/2000/svg'
				preserveAspectRatio='none'
			>
				<defs>
					<filter id='noise'>
						<feTurbulence
							type='fractalNoise'
							baseFrequency='0.8'
							numOctaves='4'
							stitchTiles='stitch'
						/>
						<feColorMatrix
							type='saturate'
							values='0'
						/>
					</filter>
				</defs>
				<image
					href='/images/home/hero/hero-bg.png'
					width='100%'
					style={{ filter: 'contrast(0.9) saturate(0.8)' }}
					height='100%'
					preserveAspectRatio='xMidYMid slice'
				/>
				<rect
					width='100%'
					height='100%'
					filter='url(#noise)'
					opacity='0.25'
				/>
			</svg>
			<div className='relative aspect-[3/4] md:aspect-video flex items-center justify-center rounded-2xl w-[80%] overflow-hidden shadow-2xs'>
				<img
					src='/images/home/hero/hero-image.png'
					alt='Hero image'
					className='w-full h-full object-cover'
				/>
			</div>
		</div>
	</div>
);

const Hero = () => (
	<section className='container max-w-7xl mx-auto px-6 py-20 md:py-32'>
		<div className='flex flex-col items-center gap-16'>
			<HeroCTA />
			<HeroImage />
		</div>
	</section>
);

export default Hero;
