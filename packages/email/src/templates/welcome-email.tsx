import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { WelcomeEmailData } from '../schema';
import { EmailLayout, HeroImage, StepList, PrimaryButton } from './shared/email-layout';

const GETTING_STARTED_STEPS = [
	{
		title: 'Install the editor extension',
		description:
			'Grab the Envval extension for VS Code. It lets you pull, push, and rotate secrets without ever leaving your editor.',
	},
	{
		title: 'Create your first repository',
		description:
			'A repository maps to a project. Add your .env files and Envval encrypts them end-to-end before they leave your machine.',
	},
	{
		title: 'Invite your team or connect another device',
		description:
			'Every change syncs instantly across all connected environments — no more pasting secrets in Slack.',
	},
] as const;

const WelcomeEmailTemplate = (props: WelcomeEmailData): React.ReactElement => {
	const {
		name,
		logoUrl,
		welcomeImageUrl,
		dashboardUrl,
		productName = 'Envval',
	} = props;

	return (
		<EmailLayout productName={productName} logoUrl={logoUrl}>
			{welcomeImageUrl && <HeroImage src={welcomeImageUrl} alt={`Welcome to ${productName}`} />}

			<h1 style={{ fontSize: '24px', margin: '0 0 16px 0', fontWeight: 700 }}>
				Welcome to {productName}.
			</h1>

			<p style={{ margin: '0 0 16px 0', color: '#444', fontSize: '15px', lineHeight: 1.7 }}>
				Hey {name}, thanks for signing up — we&apos;re genuinely excited to have you here.
			</p>

			<p style={{ margin: '0 0 16px 0', color: '#444', fontSize: '15px', lineHeight: 1.7 }}>
				{productName} is a secure environment variable manager that keeps your secrets
				encrypted end-to-end and synced across every device and team member. No more
				copy-pasting .env files, no more secrets in chat threads.
			</p>

			<p style={{ margin: '0 0 24px 0', color: '#444', fontSize: '15px', lineHeight: 1.7 }}>
				The fastest way to see it click is to give it something real to work on.
				Here&apos;s a good place to start:
			</p>

			<StepList steps={GETTING_STARTED_STEPS} />

			{dashboardUrl && (
				<PrimaryButton href={dashboardUrl} label="Go to your dashboard" />
			)}

			<p style={{ margin: '24px 0 16px 0', color: '#444', fontSize: '15px', lineHeight: 1.7 }}>
				{productName} is designed to fade into the background — your secrets stay
				safe and in sync while you focus on shipping.
			</p>

			<p style={{ margin: '0 0 16px 0', color: '#444', fontSize: '15px', lineHeight: 1.7 }}>
				If anything feels confusing, broken, or surprising, just reply to this email.
				We read and respond to every message.
			</p>

			<p style={{ margin: '0 0 4px 0', color: '#444', fontSize: '15px', lineHeight: 1.7 }}>
				Cheers,
			</p>
			<p style={{ margin: '0 0 0 0', color: '#1a1a1a', fontSize: '15px', fontWeight: 600 }}>
				The {productName} Team
			</p>
		</EmailLayout>
	);
};

export const render = (data: WelcomeEmailData) => {
	const {
		name,
		productName = 'Envval',
		supportEmail = 'support@envval.dev',
		dashboardUrl,
	} = data;

	const subject = `Welcome to ${productName}, ${name}!`;
	const html = renderToStaticMarkup(<WelcomeEmailTemplate {...data} />);

	const text = [
		productName,
		'',
		`Welcome to ${productName}.`,
		'',
		`Hey ${name}, thanks for signing up — we're genuinely excited to have you here.`,
		'',
		`${productName} is a secure environment variable manager that keeps your secrets encrypted end-to-end and synced across every device and team member. No more copy-pasting .env files, no more secrets in chat threads.`,
		'',
		`The fastest way to see it click is to give it something real to work on.`,
		'',
		'1. Install the editor extension',
		'   Grab the Envval extension for VS Code. It lets you pull, push, and rotate secrets without ever leaving your editor.',
		'',
		'2. Create your first repository',
		'   A repository maps to a project. Add your .env files and Envval encrypts them end-to-end before they leave your machine.',
		'',
		'3. Invite your team or connect another device',
		'   Every change syncs instantly across all connected environments — no more pasting secrets in Slack.',
		'',
		...(dashboardUrl ? [`Go to your dashboard: ${dashboardUrl}`, ''] : []),
		`${productName} is designed to fade into the background — your secrets stay safe and in sync while you focus on shipping.`,
		'',
		'If anything feels confusing, broken, or surprising, just reply to this email. We read and respond to every message.',
		'',
		'Cheers,',
		`The ${productName} Team`,
	].join('\n');

	return { subject, text, html };
};

export const previewData: WelcomeEmailData = {
	name: 'Rohit',
	logoUrl: '',
	welcomeImageUrl: '',
	dashboardUrl: 'https://envval.dev/dashboard',
	supportEmail: 'support@envval.dev',
	productName: 'Envval',
};
