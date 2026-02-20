import { icons } from './icons';
import { script } from './script';
import { styles } from './styles';

export function getLoginWebviewContent(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>EnvVal Sign In</title>
	<style>${styles}</style>
</head>
<body>
	<div class="container">
		<div class="logo">${icons.logo}</div>
		<h1>Sign in to EnvVal</h1>
		<p class="subtitle">Connect your account to sync environment variables securely</p>
		
		<!-- Initial State -->
		<div id="state-initial" class="state active">
			<button class="btn-primary" id="loginBtn" onclick="initiateLogin()">
		
				<span style="margin-left: 8px;">Sign in with Browser</span>
			</button>
			<p class="hint">You'll receive a code to enter in your browser</p>
		</div>
		
		<!-- Requesting Code State -->
		<div id="state-requesting" class="state">
			<div class="polling-status">
				<div class="spinner"></div>
				<span>Requesting authorization code...</span>
			</div>
		</div>
		
		<!-- Show Code State -->
		<div id="state-showCode" class="state">
			<div class="code-container">
				<div class="code-label">Your Code</div>
				<div class="user-code" id="userCode">----</div>
			</div>
			
			<p class="verification-url">
				Go to <a href="#" id="verificationLink" onclick="openBrowser(); return false;">envval.com/device</a>
			</p>
			
			<div class="button-row">
				<button class="btn-primary" onclick="openBrowser()">
					${icons.externalLinkSmall}
					<span style="margin-left: 6px;">Open Browser</span>
				</button>
				<button class="btn-secondary" onclick="copyCode()">
					${icons.copy}
					<span style="margin-left: 6px;">Copy Code</span>
				</button>
			</div>
			
			<div class="polling-status" id="pollingStatus">
				<div class="spinner"></div>
				<span>Waiting for approval in browser...</span>
			</div>
			
			<div class="timer" id="timer"></div>
			
			<button class="btn-link" onclick="cancel()">Cancel</button>
		</div>
		
		<!-- Success State -->
		<div id="state-success" class="state success">
			<div class="result-icon">${icons.check}</div>
			<div class="result-title">Successfully Connected!</div>
			<p class="result-message">Your EnvVal account is now linked.<br/>This window will close automatically.</p>
		</div>
		
		<!-- Denied State -->
		<div id="state-denied" class="state error">
			<div class="result-icon">${icons.x}</div>
			<div class="result-title">Access Denied</div>
			<p class="result-message">The authorization request was denied.</p>
			<button class="btn-primary" style="margin-top: 24px;" onclick="reset()">Try Again</button>
		</div>
		
		<!-- Expired State -->
		<div id="state-expired" class="state warning">
			<div class="result-icon">${icons.clock}</div>
			<div class="result-title" style="color: var(--warning);">Code Expired</div>
			<p class="result-message">The authorization code has expired.<br/>Please try again.</p>
			<button class="btn-primary" style="margin-top: 24px;" onclick="reset()">Try Again</button>
		</div>
		
		<!-- Error State -->
		<div id="state-error" class="state error">
			<div class="result-icon">${icons.alertCircle}</div>
			<div class="result-title">Something Went Wrong</div>
			<p class="result-message" id="errorMessage">An error occurred. Please try again.</p>
			<button class="btn-primary" style="margin-top: 24px;" onclick="reset()">Try Again</button>
		</div>
	</div>
	
	<div class="copy-feedback" id="copyFeedback">
		${icons.checkSmall}
		<span>Code copied to clipboard!</span>
	</div>

	<script>${script}</script>
</body>
</html>`;
}

