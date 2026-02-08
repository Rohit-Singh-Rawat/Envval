import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { NewDeviceEmailData } from '../schema';

const NewDeviceEmailTemplate = ({
	userName,
	deviceName,
	location,
	timestamp,
	productName = 'Envval',
}: NewDeviceEmailData): React.ReactElement => {
	const title = 'New Device Login';
	const description = 'A new device has logged into your account.';

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

			<div
				style={{
					backgroundColor: '#f5f5f5',
					padding: '16px',
					borderRadius: '8px',
					marginBottom: '24px',
				}}
			>
				<table width="100%" style={{ borderCollapse: 'collapse' }}>
					<tbody>
						<tr>
							<td style={{ padding: '4px 0', color: '#888', fontSize: '14px', width: '80px' }}>
								Device:
							</td>
							<td style={{ padding: '4px 0', color: '#333', fontSize: '14px', fontWeight: 500 }}>
								{deviceName}
							</td>
						</tr>
						{location && (
							<tr>
								<td style={{ padding: '4px 0', color: '#888', fontSize: '14px' }}>
									Location:
								</td>
								<td style={{ padding: '4px 0', color: '#333', fontSize: '14px', fontWeight: 500 }}>
									{location}
								</td>
							</tr>
						)}
						<tr>
							<td style={{ padding: '4px 0', color: '#888', fontSize: '14px' }}>
								Time:
							</td>
							<td style={{ padding: '4px 0', color: '#333', fontSize: '14px', fontWeight: 500 }}>
								{timestamp}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<p style={{ margin: '0', color: '#888', fontSize: '13px' }}>
				If this was you, you can safely ignore this email. If you don't recognize this activity, please check your account settings immediately.
			</p>
		</div>
	);
};

export const render = (data: NewDeviceEmailData) => {
	const { deviceName, productName = 'Envval' } = data;

	const subject = `New device login: ${deviceName}`;

	const html = renderToStaticMarkup(<NewDeviceEmailTemplate {...data} />);

	const text = `${productName}

New Device Login

Hi ${data.userName},

A new device has logged into your account.

Device: ${deviceName}
${data.location ? `Location: ${data.location}` : ''}
Time: ${data.timestamp}

If this was you, you can safely ignore this email. If you don't recognize this activity, please check your account settings immediately.`;

	return { subject, text, html };
};

export const previewData: NewDeviceEmailData = {
	userName: 'Jane Smith',
	deviceName: 'Chrome on Windows',
	location: 'Mumbai, India',
	timestamp: 'Feb 14, 2026, 10:30 AM',
	productName: 'Envval',
};
