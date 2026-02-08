import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { NewRepoEmailData } from '../schema';

const NewRepoEmailTemplate = ({
	userName,
	repoName,
	repoUrl,
	productName = 'Envval',
}: NewRepoEmailData): React.ReactElement => {
	const title = 'New Repository Added';
	const description = `A new repository "${repoName}" has been successfully added to your account.`;

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
			<p style={{ margin: '0 0 24px 0', color: '#666', lineHeight: 1.5 }}>
				Hi {userName},
			</p>
			<p style={{ margin: '0 0 24px 0', color: '#666', lineHeight: 1.5 }}>
				{description}
			</p>

			{repoUrl && (
				<div style={{ marginBottom: '24px' }}>
					<a
						href={repoUrl}
						style={{
							backgroundColor: '#000',
							color: '#fff',
							padding: '12px 24px',
							borderRadius: '6px',
							textDecoration: 'none',
							fontSize: '14px',
							fontWeight: 500,
							display: 'inline-block',
						}}
					>
						View Repository
					</a>
				</div>
			)}

			<p style={{ margin: '0', color: '#888', fontSize: '13px' }}>
				You are receiving this email because you have enabled notifications for new repositories.
			</p>
		</div>
	);
};

export const render = (data: NewRepoEmailData) => {
	const { repoName, productName = 'Envval' } = data;

	const subject = `New repository added: ${repoName}`;

	const html = renderToStaticMarkup(<NewRepoEmailTemplate {...data} />);
	
	const text = `${productName}

New Repository Added

Hi ${data.userName},

A new repository "${repoName}" has been successfully added to your account.

${data.repoUrl ? `View Repository: ${data.repoUrl}` : ''}

You are receiving this email because you have enabled notifications for new repositories.`;

	return { subject, text, html };
};

export const previewData: NewRepoEmailData = {
	userName: 'John Doe',
	repoName: 'my-awesome-project',
	repoUrl: 'https://envval.dev/dashboard/repos/my-awesome-project',
	productName: 'Envval',
};
