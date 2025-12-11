import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { OtpEmailData } from '../schema';

const OtpEmailTemplate = ({
	otp,
	productName = 'Envval',
}: OtpEmailData): React.ReactElement => {
	const title = 'Your sign-in code';
	const description = 'Use this one-time code to sign in. It expires soon, so enter it promptly.';

	return (
		<div
			style={{
				fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
				maxWidth: '480px',
				margin: '0 auto',
				padding: '32px',
			}}
		>
			<div style={{ marginBottom: '24px' }}>
				<strong style={{ fontSize: '16px' }}>{productName}</strong>
			</div>

			<h1 style={{ fontSize: '20px', margin: '0 0 8px 0', fontWeight: 600 }}>{title}</h1>
			<p style={{ margin: '0 0 24px 0', color: '#666', lineHeight: 1.5 }}>{description}</p>

			<div
				style={{
					fontSize: '28px',
					fontFamily: 'monospace',
					letterSpacing: '0.3em',
					padding: '16px',
					backgroundColor: '#f5f5f5',
					borderRadius: '8px',
					textAlign: 'center',
					marginBottom: '16px',
				}}
			>
				{otp}
			</div>

			<p style={{ margin: '0', color: '#888', fontSize: '13px' }}>
				Expires in 10 minutes. Do not share this code.
			</p>

			<p style={{ margin: '24px 0 0 0', color: '#999', fontSize: '12px' }}>
				If you didn't request this, you can ignore this email.
			</p>
		</div>
	);
};

export const render = (data: OtpEmailData) => {
	const { otp, productName = 'Envval' } = data;

	const subject = `${otp} is your ${productName} sign-in code`;

	const title = 'Your sign-in code';
	const description = 'Use this one-time code to sign in. It expires soon, so enter it promptly.';

	const text = `${productName}

${title}

${description}

${otp}

Expires in 10 minutes. Do not share this code.

If you didn't request this, you can ignore this email.`;

	const html = renderToStaticMarkup(<OtpEmailTemplate {...data} />);

	return { subject, text, html };
};

export const previewData: OtpEmailData = {
	otp: '123456',
	productName: 'Envval',
};

