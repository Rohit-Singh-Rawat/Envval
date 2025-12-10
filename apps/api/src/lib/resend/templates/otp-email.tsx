import * as React from 'react';

type OtpType = 'sign-in' | 'email-verification';

interface OtpEmailProps {
	otp: string;
	type: OtpType;
	productName?: string;
}

export const OtpEmail = ({ otp, type, productName = 'Envval' }: OtpEmailProps): React.ReactElement => {
	const title = type === 'email-verification' ? 'Verify your email' : 'Your sign-in code';
	const description =
		type === 'email-verification'
			? 'Use this code to confirm your email and finish creating your account.'
			: 'Use this one-time code to sign in. It expires soon, so enter it promptly.';

	const otpChars = otp.split('');

	return (
		<div
			style={{
				fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
				maxWidth: '520px',
				margin: '0 auto',
				backgroundColor: '#0b0b10',
				color: '#e8e8f2',
				padding: '28px',
				borderRadius: '18px',
				boxShadow:
					'0 10px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.04)',
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
				<div
					style={{
						width: '36px',
						height: '36px',
						borderRadius: '10px',
						background: 'linear-gradient(135deg, #6d5bff, #8676ff)',
						display: 'grid',
						placeItems: 'center',
						color: '#ffffff',
						fontWeight: 700,
						fontSize: '18px',
					}}
				>
					E
				</div>
				<div>
					<div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.01em' }}>
						{productName}
					</div>
					<div style={{ fontSize: '13px', color: '#b9b9cb' }}>Secure sign-in</div>
				</div>
			</div>

			<h1
				style={{
					fontSize: '24px',
					margin: '0 0 8px 0',
					color: '#ffffff',
					letterSpacing: '-0.01em',
				}}
			>
				{title}
			</h1>
			<p style={{ margin: '0 0 18px 0', color: '#cfd0dd', lineHeight: 1.6, fontSize: '15px' }}>
				{description}
			</p>

			<div
				style={{
					backgroundColor: '#13131b',
					borderRadius: '14px',
					padding: '18px',
					border: '1px solid rgba(255,255,255,0.06)',
					display: 'grid',
					gap: '10px',
				}}
			>
				<div style={{ color: '#9ea0b5', fontSize: '13px', letterSpacing: '0.04em' }}>
					Your one-time code
				</div>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						gap: '10px',
						fontFamily: 'Consolas, Monaco, "SFMono-Regular", monospace',
						fontSize: '22px',
						color: '#ffffff',
						letterSpacing: '0.24em',
						padding: '10px 12px',
						background:
							'linear-gradient(135deg, rgba(109,91,255,0.12), rgba(115,85,246,0.08))',
						borderRadius: '12px',
						boxShadow: '0 8px 20px rgba(109,91,255,0.16)',
					}}
				>
					<span style={{ minWidth: '16px', textAlign: 'center' }}>{otpChars[0] || ''}</span>
					<span style={{ minWidth: '16px', textAlign: 'center' }}>{otpChars[1] || ''}</span>
					<span style={{ minWidth: '16px', textAlign: 'center' }}>{otpChars[2] || ''}</span>
					<span style={{ minWidth: '16px', textAlign: 'center' }}>{otpChars[3] || ''}</span>
					<span style={{ minWidth: '16px', textAlign: 'center' }}>{otpChars[4] || ''}</span>
					<span style={{ minWidth: '16px', textAlign: 'center' }}>{otpChars[5] || ''}</span>
				</div>
				<div style={{ color: '#8f90a6', fontSize: '12px' }}>
					Expires in 10 minutes. Do not share this code with anyone.
				</div>
			</div>

			<p style={{ margin: '18px 0 0 0', color: '#8f90a6', fontSize: '12px', lineHeight: 1.5 }}>
				If you didn't request this, you can ignore this email.
			</p>
		</div>
	);
};
