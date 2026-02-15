export const styles = `
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

:root {
	--primary: #5b7cf7;
	--primary-hover: #4a6ae5;
	--primary-foreground: #ffffff;
	--background: #fafaf8;
	--foreground: #1a1a1a;
	--muted: #f0efe8;
	--muted-foreground: #6b6b6b;
	--border: #e5e5e0;
	--success: #22c55e;
	--error: #ef4444;
	--warning: #f59e0b;
}

body {
	font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	padding: 24px;
	color: var(--foreground);
	background: linear-gradient(135deg, var(--background) 0%, #f5f5f0 100%);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	-webkit-font-smoothing: antialiased;
}

.container {
	max-width: 420px;
	width: 100%;
	text-align: center;
}

.logo {
	margin-bottom: 8px;
	display: flex;
	justify-content: center;
}

.logo svg {
	width: 72px;
	height: 72px;
}

h1 {
	font-size: 24px;
	font-weight: 600;
	margin-bottom: 8px;
	color: var(--foreground);
	letter-spacing: -0.02em;
}

.subtitle {
	color: var(--muted-foreground);
	margin-bottom: 32px;
	font-size: 15px;
	line-height: 1.6;
}

/* States */
.state {
	display: none;
}
.state.active {
	display: block;
}

/* Buttons */
.btn-primary {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 12px 28px;
	font-size: 15px;
	font-weight: 500;
	font-family: inherit;
	border: none;
	border-radius: 10px;
	cursor: pointer;
	transition: all 0.2s ease;
	background: var(--primary);
	color: var(--primary-foreground);
	box-shadow: 
		0 1px 2px rgba(0,0,0,0.1),
		0 2px 4px rgba(0,0,0,0.1),
		inset 0 1px 0 rgba(255,255,255,0.2),
		0 4px 12px rgba(91,124,247,0.25);
	overflow: hidden;
}

.btn-primary::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 50%;
	background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%);
	pointer-events: none;
}

.btn-primary:hover:not(:disabled) {
	background: var(--primary-hover);
	transform: translateY(-1px);
	box-shadow: 
		0 2px 4px rgba(0,0,0,0.1),
		0 4px 8px rgba(0,0,0,0.1),
		inset 0 1px 0 rgba(255,255,255,0.2),
		0 6px 16px rgba(91,124,247,0.3);
}

.btn-primary:active:not(:disabled) {
	transform: translateY(0) scale(0.98);
}

.btn-primary:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.btn-secondary {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 12px 20px;
	font-size: 14px;
	font-weight: 500;
	font-family: inherit;
	border: 1px solid var(--border);
	border-radius: 10px;
	cursor: pointer;
	transition: all 0.2s ease;
	background: var(--muted);
	color: var(--foreground);
}

.btn-secondary:hover {
	background: #e8e7e0;
	border-color: #d5d5d0;
}

.btn-secondary:active {
	transform: scale(0.98);
}

.btn-link {
	background: none;
	border: none;
	color: var(--muted-foreground);
	cursor: pointer;
	font-size: 13px;
	font-family: inherit;
	padding: 8px 16px;
	margin-top: 16px;
	transition: color 0.2s;
}

.btn-link:hover {
	color: var(--foreground);
}

/* Code display */
.code-container {
	background: linear-gradient(135deg, #fafaf8 0%, #f5f5f0 100%);
	border: 2px solid var(--primary);
	border-radius: 12px;
	padding: 24px;
	margin: 24px 0;
}

.code-label {
	font-size: 11px;
	color: var(--muted-foreground);
	margin-bottom: 8px;
	text-transform: uppercase;
	letter-spacing: 1.5px;
	font-weight: 500;
}

.user-code {
	font-size: 36px;
	font-weight: 700;
	font-family: ui-monospace, 'Cascadia Code', 'SF Mono', Menlo, Monaco, Consolas, monospace;
	letter-spacing: 6px;
	color: var(--primary);
}

.verification-url {
	font-size: 14px;
	color: var(--muted-foreground);
	margin: 16px 0;
}

.verification-url a {
	color: var(--primary);
	text-decoration: none;
	font-weight: 500;
}

.verification-url a:hover {
	text-decoration: underline;
}

.button-row {
	display: flex;
	gap: 12px;
	justify-content: center;
	margin-top: 20px;
}

/* Polling status */
.polling-status {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	margin-top: 24px;
	padding: 14px 20px;
	background: var(--muted);
	border-radius: 10px;
	font-size: 14px;
	color: var(--muted-foreground);
}

.spinner {
	width: 18px;
	height: 18px;
	border: 2px solid var(--border);
	border-top-color: var(--primary);
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

/* Result states */
.result-icon {
	width: 80px;
	height: 80px;
	margin: 0 auto 20px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.result-icon svg {
	width: 40px;
	height: 40px;
}

.success .result-icon {
	background: rgba(34, 197, 94, 0.1);
}

.success .result-icon svg {
	color: var(--success);
}

/* Animated success check: circle draws in, then check (ease-out, <300ms total) */
.success .result-icon {
	animation: success-icon-pop 0.25s cubic-bezier(0.32, 0.72, 0, 1) forwards;
}

.success .result-icon .success-check-circle {
	animation: success-circle-draw 0.2s 0.05s cubic-bezier(0.32, 0.72, 0, 1) forwards;
}

.success .result-icon .success-check-mark {
	animation: success-check-draw 0.22s 0.18s cubic-bezier(0.32, 0.72, 0, 1) forwards;
}

@keyframes success-icon-pop {
	from {
		opacity: 0;
		transform: scale(0.92);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
}

@keyframes success-circle-draw {
	to {
		stroke-dashoffset: 0;
	}
}

@keyframes success-check-draw {
	to {
		stroke-dashoffset: 0;
	}
}

@media (prefers-reduced-motion: reduce) {
	.success .result-icon,
	.success .result-icon .success-check-circle,
	.success .result-icon .success-check-mark {
		animation-duration: 0.01ms;
		animation-delay: 0s;
	}
	.success .result-icon {
		opacity: 1;
		transform: scale(1);
	}
	.success .result-icon .success-check-circle,
	.success .result-icon .success-check-mark {
		stroke-dashoffset: 0;
	}
}

.error .result-icon {
	background: rgba(239, 68, 68, 0.1);
}

.error .result-icon svg {
	color: var(--error);
}

.warning .result-icon {
	background: rgba(245, 158, 11, 0.1);
}

.warning .result-icon svg {
	color: var(--warning);
}

.result-title {
	font-size: 20px;
	font-weight: 600;
	margin-bottom: 8px;
}

.success .result-title {
	color: var(--success);
}

.error .result-title {
	color: var(--error);
}

.result-message {
	color: var(--muted-foreground);
	font-size: 14px;
	line-height: 1.6;
}

/* Timer */
.timer {
	font-size: 13px;
	color: var(--muted-foreground);
	margin-top: 12px;
	font-variant-numeric: tabular-nums;
}

/* Copy feedback */
.copy-feedback {
	position: fixed;
	bottom: 24px;
	left: 50%;
	transform: translateX(-50%) translateY(20px);
	background: var(--foreground);
	color: var(--background);
	padding: 12px 24px;
	border-radius: 10px;
	font-size: 14px;
	font-weight: 500;
	opacity: 0;
	transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease-out;
	box-shadow: 0 4px 12px rgba(0,0,0,0.15);
	display: flex;
	align-items: center;
	gap: 8px;
}

.copy-feedback.show {
	opacity: 1;
	transform: translateX(-50%) translateY(0);
}

.copy-feedback.show .copy-check-path {
	animation: copy-check-draw 0.3s 0.1s cubic-bezier(0.32, 0.72, 0, 1) forwards;
}

@keyframes copy-check-draw {
	to {
		stroke-dashoffset: 0;
	}
}

@media (prefers-reduced-motion: reduce) {
	.copy-feedback.show .copy-check-path {
		animation: none;
		stroke-dashoffset: 0;
	}
}

.hint {
	margin-top: 24px;
	font-size: 13px;
	color: var(--muted-foreground);
}
`;

