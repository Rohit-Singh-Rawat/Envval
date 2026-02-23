import { icons } from "./icons";
import { script } from "./script";
import { styles } from "./styles";

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
	<main class="container" role="main" aria-label="EnvVal sign in">
		<div class="logo" aria-hidden="true">${icons.logo}</div>
		<h1>Sign in to EnvVal</h1>

		<div id="state-initial" class="state active" role="region" aria-label="Sign in options">
			<p class="step-hint">We'll open your browser to connect your account.</p>
			<button type="button" class="btn-primary" id="loginBtn" aria-label="Sign in with browser" onclick="initiateLogin()">
				<span style="margin-left: 8px;">Sign in with Browser</span>
			</button>
		</div>

		<div id="state-requesting" class="state" role="status" aria-live="polite" aria-busy="true">
			<div class="polling-status">
				<div class="spinner" aria-hidden="true"></div>
				<span>Requesting code…</span>
			</div>
		</div>

		<div id="state-showCode" class="state" role="region" aria-label="Verification code">
			<p class="step-hint">Enter this code in the browser when prompted.</p>
			<div class="code-container" onclick="copyCode()" role="button" tabindex="0" title="Click to copy" aria-label="Verification code, click to copy" id="codeContainer">
				<div class="user-code" id="userCode" aria-live="polite">----</div>
			</div>
			<button type="button" class="btn-primary" id="copyOpenBtn" aria-label="Copy code and open browser" onclick="copyAndOpenBrowser()">
				${icons.externalLinkSmall}
				<span style="margin-left: 8px;">Copy code & open browser</span>
			</button>
			<p class="waiting-line" id="waitingLine" role="status" aria-live="polite">
				<span class="spinner-inline" aria-hidden="true"></span>
				Waiting for you to sign in…
			</p>
			<div class="timer" id="timer" role="timer" aria-live="polite"></div>
			<button type="button" class="btn-link" onclick="cancel()">Cancel</button>
		</div>

		<div id="state-success" class="state success" role="status" aria-live="polite">
			<div class="result-icon" aria-hidden="true">${icons.check}</div>
			<p class="result-title">You're connected</p>
			<p class="result-message">This window will close in a moment.</p>
		</div>

		<div id="state-denied" class="state error" role="alert">
			<div class="result-icon" aria-hidden="true">${icons.x}</div>
			<p class="result-title">Access denied</p>
			<p class="result-message">Authorization was denied.</p>
			<button type="button" class="btn-primary" onclick="reset()">Try again</button>
		</div>

		<div id="state-expired" class="state warning" role="alert">
			<div class="result-icon" aria-hidden="true">${icons.clock}</div>
			<p class="result-title">Code expired</p>
			<p class="result-message">Please start sign in again.</p>
			<button type="button" class="btn-primary" onclick="reset()">Try again</button>
		</div>

		<div id="state-error" class="state error" role="alert">
			<div class="result-icon" aria-hidden="true">${icons.alertCircle}</div>
			<p class="result-title">Something went wrong</p>
			<p class="result-message" id="errorMessage">An error occurred. Please try again.</p>
			<button type="button" class="btn-primary" onclick="reset()">Try again</button>
		</div>
	</main>

	<div class="copy-feedback" id="copyFeedback" role="status" aria-live="polite" aria-atomic="true">
		${icons.checkSmall}
		<span>Code copied</span>
	</div>

	<script>${script}</script>
</body>
</html>`;
}
