export const DEFAULT_POLL_INTERVAL_SECONDS = 60;
export const DEFAULT_LOGGING_VERBOSE = false;
export const VSCODE_CONFIG_SECTION = 'envvault';
export const API_BASE_URL = 'http://localhost:3000';

// URL of the EnvVault web sign-in page that handles VS Code login.
// The backend should read the `scheme` query param and redirect back to:
//   `${scheme}://<your-extension-id>/auth-callback?token=<PAT_OR_CODE>`
// You can adjust this path/domain to match your actual web app.
export const ENVVAULT_SIGNIN_URL = 'https://envvault.app/signin?vscode=1';

export const METADATA_STORAGE_KEY = 'envvault.metadata';
export const IGNORED_ENV_FILES = [
  '.env.example',
  '.env.sample',
  '.env.template',
  '.env.dist',
  '.env.test',
  '.env.testing',
];