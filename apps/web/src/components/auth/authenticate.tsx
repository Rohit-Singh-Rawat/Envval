import { Link } from '@tanstack/react-router';
import EnvvalLogo from '../logo/envval';
import AuthForm from './auth-form';

type AuthenticateProps = {
	mode?: 'login' | 'signup';
};

function Authenticate({ mode = 'login' }: AuthenticateProps) {
	const isLogin = mode === 'login';

	return (
		<div className='flex flex-col items-center justify-center w-full max-w-md gap-6	'>
			<EnvvalLogo className='size-12' />
			<div className='md:text-left text-center space-y-1 w-full'>
				<h1>{isLogin ? 'Login' : 'Create account'}</h1>
				<p className='text-lg text-muted-foreground'>
					{isLogin ? "Welcome back, let's get you signed in." : 'Join us to get started.'}
				</p>
			</div>

			<AuthForm mode={mode} />

			<div className='text-sm text-muted-foreground text-center'>
				{isLogin ? (
					<span>
						Don&apos;t have an account?{' '}
						<Link
							to='/signup'
							className='hover:text-primary  hover:underline font-medium'
						>
							Sign up
						</Link>
					</span>
				) : (
					<span>
						Already have an account?{' '}
						<Link
							to='/login'
							className='hover:text-primary  hover:underline font-medium'
						>
							Log in
						</Link>
					</span>
				)}
			</div>
		</div>
	);
}
export default Authenticate;
