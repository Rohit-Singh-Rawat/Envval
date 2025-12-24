import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { z } from 'zod';

const DeviceSearchSchema = z.object({
	user_code: z.string().optional(),
});

export const Route = createFileRoute('/_dashboard/device')({
	component: RouteComponent,
	validateSearch: DeviceSearchSchema,
});

function DeviceAuthorizationContent({ userCode }: { userCode: string }) {
	const [processing, setProcessing] = useState(false);
	const [result, setResult] = useState<'approved' | 'denied' | null>(null);

	const handleApprove = async () => {
		setProcessing(true);
		try {
			await authClient.device.approve({ userCode });
			setResult('approved');
		} catch (err) {
			alert('Failed to approve device');
		}
		setProcessing(false);
	};

	const handleDeny = async () => {
		setProcessing(true);
		try {
			await authClient.device.deny({ userCode });
			setResult('denied');
		} catch (err) {
			alert('Failed to deny device');
		}
		setProcessing(false);
	};

	if (result) {
		return (
			<div className=' flex items-center justify-center'>
				<div className='max-w-md w-full p-6 text-center'>
					{result === 'approved' ? (
						<>
							<div className='text-6xl mb-4'>✅</div>
							<h2 className='text-lg font-semibold'>Device Approved!</h2>
							<p className='text-sm text-muted-foreground'>
								You can now close this window and return to VS Code.
							</p>
						</>
					) : (
						<>
							<div className='text-6xl mb-4'>❌</div>
							<h2 className='text-lg font-semibold'>Device Denied</h2>
							<p className='text-sm text-muted-foreground'>The device authorization was denied.</p>
						</>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className=' flex items-center justify-center'>
			<div className='max-w-md w-full p-6'>
				<div className='mb-6 text-center'>
					<h2 className='text-lg font-semibold'>Authorize Device</h2>
					<p className='text-sm text-muted-foreground'>
						A device is requesting access to your EnvVal account.
					</p>
				</div>
				<div className='space-y-6'>
					<div className='p-4 text-center'>
						<div className='text-sm text-muted-foreground'>Device Code</div>
						<div className='text-xl font-mono'>{userCode}</div>
					</div>

					<div className='flex gap-4'>
						<Button
							variant='outline'
							onClick={handleDeny}
							disabled={processing}
							className='flex-1'
						>
							Deny
						</Button>
						<Button
							onClick={handleApprove}
							disabled={processing}
							className='flex-1'
						>
							{processing ? 'Approving...' : 'Approve'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

function RouteComponent() {
	const { user_code: userCode } = Route.useSearch();

	if (!userCode) {
		return (
			<div className=' flex items-center justify-center'>
				<div className='max-w-md w-full p-6 text-center'>
					<h2 className='text-lg font-semibold'>Missing Device Code</h2>
					<p className='text-sm text-muted-foreground'>No device code was provided in the URL.</p>
				</div>
			</div>
		);
	}

	return <DeviceAuthorizationContent userCode={userCode} />;
}
