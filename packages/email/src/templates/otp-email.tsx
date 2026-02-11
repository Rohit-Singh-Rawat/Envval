import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { OtpEmailData } from '../schema';
import { EmailLayout, Muted } from './shared/email-layout';

const OtpEmailTemplate = (props: OtpEmailData): React.ReactElement => {
	const {
		otp,
		logoUrl,
		supportEmail = 'support@envval.dev',
		productName = 'Envval',
	} = props;

	return (
		<EmailLayout productName={productName} logoUrl={logoUrl}>
			<h1 style={{ fontSize: '24px', margin: '0 0 12px 0', fontWeight: 700 }}>
				Your sign-in code
			</h1>

			<p style={{ margin: '0 0 24px 0', color: '#444', fontSize: '15px', lineHeight: 1.6 }}>
				Use this one-time code to sign in to your <strong>{productName}</strong> account.
				It expires soon, so enter it promptly.
			</p>

			<div
				style={{
					fontSize: '32px',
					fontFamily: 'monospace',
					letterSpacing: '0.3em',
					padding: '20px',
					backgroundColor: '#f6f6f6',
					borderRadius: '8px',
					textAlign: 'center',
					marginBottom: '20px',
					fontWeight: 700,
					color: '#1a1a1a',
				}}
			>
				{otp}
			</div>

			<Muted>Expires in 10 minutes. Do not share this code with anyone.</Muted>

			<Muted size={12}>
				If you didn&apos;t request this code, you can safely ignore this email.
				If you&apos;re concerned about your account security, reach out to{' '}
				<a href={`mailto:${supportEmail}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
					{supportEmail}
				</a>
				.
			</Muted>
		</EmailLayout>
	);
};

export const render = (data: OtpEmailData) => {
	const { otp, productName = 'Envval', supportEmail = 'support@envval.dev' } = data;

	const subject = `${otp} is your ${productName} sign-in code`;
	const html = renderToStaticMarkup(<OtpEmailTemplate {...data} />);

	const text = [
		productName,
		'',
		'Your sign-in code',
		'',
		`Use this one-time code to sign in to your ${productName} account. It expires soon, so enter it promptly.`,
		'',
		otp,
		'',
		'Expires in 10 minutes. Do not share this code with anyone.',
		'',
		`If you didn't request this code, you can safely ignore this email. If you're concerned about your account security, reach out to ${supportEmail}.`,
	].join('\n');

	return { subject, text, html };
};

export const previewData: OtpEmailData = {
	otp: '847 293',
	logoUrl: '',
	supportEmail: 'support@envval.dev',
	productName: 'Envval',
};
