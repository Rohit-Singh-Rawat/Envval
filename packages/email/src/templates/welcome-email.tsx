import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { WelcomeEmailData } from '../schema';

const WelcomeEmailTemplate = ({
	name,
	productName = 'Envval',
}: WelcomeEmailData): React.ReactElement => {
	const title = 'Welcome to ' + productName + '!';
	const description = `Hi ${name}, we're thrilled to have you on board.`;

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

			<p style={{ margin: '0 0 16px 0', color: '#333', lineHeight: 1.6 }}>
				You're all set! Your account is ready and you can start using {productName} right away.
			</p>

			<p style={{ margin: '24px 0 0 0', color: '#999', fontSize: '12px' }}>
				If you have any questions, feel free to reach out to our support team.
			</p>
		</div>
	);
};

export const render = (data: WelcomeEmailData) => {
	const { name, productName = 'Envval' } = data;

	const subject = `Welcome to ${productName}!`;

	const title = 'Welcome to ' + productName + '!';
	const description = `Hi ${name}, we're thrilled to have you on board.`;

	const text = `${productName}

${title}

${description}

You're all set! Your account is ready and you can start using ${productName} right away.

If you have any questions, feel free to reach out to our support team.`;

	const html = renderToStaticMarkup(<WelcomeEmailTemplate {...data} />);

	return { subject, text, html };
};

export const previewData: WelcomeEmailData = {
	name: 'John Doe',
	productName: 'Envval',
};
