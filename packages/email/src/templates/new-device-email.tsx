import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { NewDeviceEmailData } from '../schema';
import { EmailLayout, InfoBox, PrimaryButton, Muted } from './shared/email-layout';

const NewDeviceEmailTemplate = (props: NewDeviceEmailData): React.ReactElement => {
	const {
		userName,
		deviceName,
		signInType,
		location,
		ipAddress,
		timestamp,
		revokeUrl,
		supportEmail = 'support@envval.dev',
		logoUrl,
		productName = 'Envval',
	} = props;

	const infoRows: Array<{ label: string; value: string }> = [
		...(signInType ? [{ label: 'Sign in type', value: signInType }] : []),
		{ label: 'Device type', value: deviceName },
		...(location
			? [{ label: 'Location', value: ipAddress ? `${location} (${ipAddress})` : location }]
			: []),
		{ label: 'Time', value: timestamp },
	];

	return (
		<EmailLayout productName={productName} logoUrl={logoUrl}>
			<h1 style={{ fontSize: '24px', margin: '0 0 12px 0', fontWeight: 700 }}>
				New sign in to your account
			</h1>

			<p style={{ margin: '0 0 8px 0', color: '#444', fontSize: '15px', lineHeight: 1.6 }}>
				Hi {userName},
			</p>

			<p style={{ margin: '0 0 24px 0', color: '#444', fontSize: '15px', lineHeight: 1.6 }}>
				A new device just signed in to your <strong>{productName}</strong> account.
				If you don&apos;t recognize this device, please check your account for any
				unauthorized activity, and also make sure that the sign in type used is secure.
			</p>

			<InfoBox rows={infoRows} />

			{revokeUrl && (
				<>
					<p style={{ margin: '0 0 16px 0', color: '#444', fontSize: '14px', lineHeight: 1.5 }}>
						To immediately sign out of this device click the button below.
					</p>

					<PrimaryButton href={revokeUrl} label="Sign out of this device" />

					<Muted size={12}>
						If you&apos;re having trouble with the above button,{' '}
						<a href={revokeUrl} style={{ color: '#2563eb', textDecoration: 'underline' }}>
							click here
						</a>
						.
					</Muted>
				</>
			)}

			<Muted>
				If you have any questions or need any help, please reach out to{' '}
				<a href={`mailto:${supportEmail}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
					{supportEmail}
				</a>{' '}
				as soon as possible.
			</Muted>
		</EmailLayout>
	);
};

export const render = (data: NewDeviceEmailData) => {
	const { deviceName, productName = 'Envval', supportEmail = 'support@envval.dev' } = data;

	const subject = `New device login: ${deviceName}`;
	const html = renderToStaticMarkup(<NewDeviceEmailTemplate {...data} />);

	const locationLine = data.location
		? `Location: ${data.location}${data.ipAddress ? ` (${data.ipAddress})` : ''}`
		: '';

	const text = [
		productName,
		'',
		'New sign in to your account',
		'',
		`Hi ${data.userName},`,
		'',
		`A new device just signed in to your ${productName} account. If you don't recognize this device, please check your account for any unauthorized activity.`,
		'',
		...(data.signInType ? [`Sign in type: ${data.signInType}`] : []),
		`Device type: ${deviceName}`,
		...(locationLine ? [locationLine] : []),
		`Time: ${data.timestamp}`,
		'',
		...(data.revokeUrl
			? [`To sign out of this device: ${data.revokeUrl}`, '']
			: []),
		`If you have any questions, reach out to ${supportEmail}.`,
	].join('\n');

	return { subject, text, html };
};

export const previewData: NewDeviceEmailData = {
	userName: 'Jane Smith',
	deviceName: 'Windows Chrome for Windows',
	signInType: 'OAuth',
	location: 'Mumbai, India',
	ipAddress: '2405:201:4022:20f1:a1dd:1154:23f4:e8d4',
	timestamp: 'Feb 14, 2026, 10:30 AM +0530',
	revokeUrl: 'https://envval.dev/devices/revoke?token=example',
	supportEmail: 'support@envval.dev',
	productName: 'Envval',
};
