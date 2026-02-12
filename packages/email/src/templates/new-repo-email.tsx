import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { NewRepoEmailData } from '../schema';
import { EmailLayout, PrimaryButton, Muted } from './shared/email-layout';

const REPO_NAME_COLOR = '#2563eb';

const NewRepoEmailTemplate = (props: NewRepoEmailData): React.ReactElement => {
	const {
		userName,
		repoName,
		repoUrl,
		logoUrl,
		productName = 'Envval',
	} = props;

	return (
		<EmailLayout productName={productName} logoUrl={logoUrl}>
			<h1 style={{ fontSize: '24px', margin: '0 0 12px 0', fontWeight: 600 }}>
				New repository added
			</h1>

			<p style={{ margin: '0 0 8px 0', color: '#444', fontSize: '15px', lineHeight: 1.6 }}>
				Hi {userName},
			</p>

			<p style={{ margin: '0 0 24px 0', color: '#444', fontSize: '15px', lineHeight: 1.6 }}>
				A new repository{' '}
				<strong style={{ color: REPO_NAME_COLOR }}>{repoName}</strong>{' '}
				has been successfully added to your <strong>{productName}</strong> account.
				You can now manage environment variables for this project from your dashboard
				or directly in your editor.
			</p>

			{repoUrl && (
				<PrimaryButton href={repoUrl} label="View Repository" />
			)}

			<Muted>
				You are receiving this email because you have enabled notifications for new repositories.
			</Muted>
		</EmailLayout>
	);
};

export const render = (data: NewRepoEmailData) => {
	const { repoName, productName = 'Envval' } = data;

	const subject = `New repository added: ${repoName}`;
	const html = renderToStaticMarkup(<NewRepoEmailTemplate {...data} />);

	const text = [
		productName,
		'',
		'New repository added',
		'',
		`Hi ${data.userName},`,
		'',
		`A new repository "${repoName}" has been successfully added to your ${productName} account. You can now manage environment variables for this project from your dashboard or directly in your editor.`,
		'',
		...(data.repoUrl ? [`View Repository: ${data.repoUrl}`, ''] : []),
		'You are receiving this email because you have enabled notifications for new repositories.',
	].join('\n');

	return { subject, text, html };
};

export const previewData: NewRepoEmailData = {
	userName: 'Rohit',
	repoName: 'envval-production',
	repoUrl: 'https://envval.dev/dashboard/repos/envval-production',
	logoUrl: '',
	supportEmail: 'support@envval.dev',
	productName: 'Envval',
};
