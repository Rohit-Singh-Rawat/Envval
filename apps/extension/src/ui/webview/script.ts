export const script = `
const vscode = acquireVsCodeApi();

let currentState = 'initial';
let expiresAt = null;
let timerInterval = null;

function setState(state, data = {}) {
	currentState = state;
	
	document.querySelectorAll('.state').forEach(el => el.classList.remove('active'));
	
	const stateEl = document.getElementById('state-' + state);
	if (stateEl) {
		stateEl.classList.add('active');
	}
	
	if (state === 'showCode' && data.userCode) {
		document.getElementById('userCode').textContent = data.userCode;
		if (data.verificationUrl) {
			document.getElementById('verificationLink').href = data.verificationUrl;
			document.getElementById('verificationLink').textContent = data.verificationUrl.replace('https://', '').replace('http://', '');
		}
		if (data.expiresIn) {
			startTimer(data.expiresIn);
		}
	}
	
	if (state === 'error' && data.message) {
		document.getElementById('errorMessage').textContent = data.message;
	}
}

function startTimer(seconds) {
	expiresAt = Date.now() + (seconds * 1000);
	updateTimer();
	timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
	if (!expiresAt) return;
	
	const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
	const minutes = Math.floor(remaining / 60);
	const secs = remaining % 60;
	
	document.getElementById('timer').textContent = 
		'Code expires in ' + minutes + ':' + secs.toString().padStart(2, '0');
	
	if (remaining <= 0) {
		clearInterval(timerInterval);
	}
}

function initiateLogin() {
	vscode.postMessage({ command: 'initiateLogin' });
}

function openBrowser() {
	vscode.postMessage({ command: 'openBrowser' });
}

function copyCode() {
	vscode.postMessage({ command: 'copyCode' });
}

function cancel() {
	clearInterval(timerInterval);
	vscode.postMessage({ command: 'cancel' });
}

function reset() {
	clearInterval(timerInterval);
	setState('initial');
}

function showCopyFeedback() {
	const feedback = document.getElementById('copyFeedback');
	feedback.classList.add('show');
	setTimeout(() => feedback.classList.remove('show'), 2000);
}

window.addEventListener('message', event => {
	const message = event.data;
	
	switch (message.command) {
		case 'setState':
			setState(message.state, message);
			break;
		case 'codeCopied':
			showCopyFeedback();
			break;
	}
});
`;

