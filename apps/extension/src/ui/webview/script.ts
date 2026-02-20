export const script = `
const vscode = acquireVsCodeApi();

let currentState = 'initial';
let expiresAt = null;
let timerInterval = null;

function setState(state, data = {}) {
	currentState = state;

	document.querySelectorAll('.state').forEach(function (el) {
		el.classList.remove('active');
		el.setAttribute('aria-hidden', 'true');
	});

	const stateEl = document.getElementById('state-' + state);
	if (stateEl) {
		stateEl.classList.add('active');
		stateEl.removeAttribute('aria-hidden');
	}

	if (state === 'showCode' && data.userCode) {
		const codeEl = document.getElementById('userCode');
		if (codeEl) codeEl.textContent = data.userCode;
		if (data.expiresIn) startTimer(data.expiresIn);
		setTimeout(function () {
			const btn = document.getElementById('copyOpenBtn');
			if (btn) btn.focus();
		}, 0);
	}

	if (state === 'error' && data.message) {
		const msgEl = document.getElementById('errorMessage');
		if (msgEl) msgEl.textContent = data.message;
	}
}

function startTimer(seconds) {
	expiresAt = Date.now() + seconds * 1000;
	updateTimer();
	timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
	if (!expiresAt) return;
	const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
	const minutes = Math.floor(remaining / 60);
	const secs = remaining % 60;
	const timerEl = document.getElementById('timer');
	if (timerEl) timerEl.textContent = 'Expires in ' + minutes + ':' + (secs < 10 ? '0' : '') + secs;
	if (remaining <= 0) clearInterval(timerInterval);
}

function initiateLogin() {
	vscode.postMessage({ command: 'initiateLogin' });
}

function copyAndOpenBrowser() {
	vscode.postMessage({ command: 'copyAndOpen' });
	showCopyFeedback();
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
	if (feedback) {
		feedback.classList.add('show');
		setTimeout(function () { feedback.classList.remove('show'); }, 2000);
	}
}

const codeContainer = document.getElementById('codeContainer');
if (codeContainer) {
	codeContainer.addEventListener('keydown', function (e) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			copyCode();
			showCopyFeedback();
		}
	});
}

window.addEventListener('message', function (event) {
	const message = event.data;
	if (message.command === 'setState') setState(message.state, message);
	if (message.command === 'codeCopied') showCopyFeedback();
});
`;
