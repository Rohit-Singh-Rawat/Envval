import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { IGNORED_ENV_FILES } from '../lib/constants';
import { ENV_FILE_INCLUDE_PATTERN, ENV_FILE_EXCLUDE_PATTERN } from '../lib/file-patterns';
import { isValidEnvFilePath, normalizeEnvFilePath } from './env-file-name';
import { RepoIdentityStore } from '../services/repo-identity-store';
import { WorkspaceContextProvider } from '../services/workspace-context-provider';
import { WorkspaceValidator } from '../services/workspace-validator';
import type { Logger } from '../utils/logger';
import { formatError } from './format-error';

const execFileAsync = promisify(execFile);

// ── Public types ──────────────────────────────────────────────────────────────

export interface WorkspaceIdentity {
	repoId: string;
	identitySource: 'manual' | 'git' | 'stored-git' | 'content' | 'user-specified';
	gitRemote?: string;
	gitRemoteUrl?: string;
	gitRemoteType?: 'normal' | 'submodule' | 'worktree';
	subProjectPath?: string;
	workspacePath: string;
	requiresMigration?: boolean;
	suggestedMigration?: {
		oldRepoId: string;
		newRepoId: string;
		reason: string;
	};
	monorepoDetected?: boolean;
	availableSubProjects?: string[];
}

interface GitRemoteResult {
	remoteUrl: string;
	type: 'normal' | 'submodule' | 'worktree';
	parentRemote?: string;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Builds migration fields for a WorkspaceIdentity.
 * Returns no-migration defaults when the new repoId matches the last known one.
 */
function buildMigrationInfo(
	lastActiveRepoId: string | undefined,
	newRepoId: string,
	reason: string
): Pick<WorkspaceIdentity, 'requiresMigration' | 'suggestedMigration'> {
	if (!lastActiveRepoId || lastActiveRepoId === newRepoId) {
		return { requiresMigration: false };
	}
	return {
		requiresMigration: true,
		suggestedMigration: { oldRepoId: lastActiveRepoId, newRepoId, reason },
	};
}

function detectSubmodule(workspacePath: string): { isSubmodule: boolean; parentPath?: string } {
	const gitFile = path.join(workspacePath, '.git');
	if (!fs.existsSync(gitFile) || !fs.statSync(gitFile).isFile()) {
		return { isSubmodule: false };
	}
	try {
		const content = fs.readFileSync(gitFile, 'utf-8').trim();
		const match = content.match(/^gitdir:\s*(.+)$/);
		if (match) {
			const gitdirPath = path.resolve(workspacePath, match[1]);
			return { isSubmodule: true, parentPath: path.dirname(path.dirname(gitdirPath)) };
		}
	} catch {
		// ignore read errors
	}
	return { isSubmodule: false };
}

function detectWorktree(workspacePath: string): { isWorktree: boolean; mainRepoPath?: string } {
	const gitFile = path.join(workspacePath, '.git');
	if (!fs.existsSync(gitFile) || !fs.statSync(gitFile).isFile()) {
		return { isWorktree: false };
	}
	try {
		const content = fs.readFileSync(gitFile, 'utf-8').trim();
		const match = content.match(/^gitdir:\s*(.+)$/);
		if (match) {
			const gitdirPath = path.resolve(workspacePath, match[1]);
			const worktreesDir = path.dirname(gitdirPath);
			if (path.basename(worktreesDir) === 'worktrees') {
				return { isWorktree: true, mainRepoPath: path.dirname(path.dirname(worktreesDir)) };
			}
		}
	} catch {
		// ignore read errors
	}
	return { isWorktree: false };
}

function selectBestRemote(remotes: Map<string, string>): { name: string; url: string } | undefined {
	for (const name of ['origin', 'upstream']) {
		const url = remotes.get(name);
		if (url) {
			return { name, url };
		}
	}
	const first = remotes.entries().next();
	return first.done ? undefined : { name: first.value[0], url: first.value[1] };
}

function normalizeGitUrl(url: string): string {
	let normalized = url.replace(/\.git$/, '');
	const sshMatch = normalized.match(/^git@(.+?):(.+)$/);
	if (sshMatch) {
		normalized = `https://${sshMatch[1]}/${sshMatch[2]}`;
	}
	return normalized
		.replace(/^https?:\/\//, '')
		.replace(/^www\./, '')
		.replace(/\/$/, '')
		.toLowerCase();
}

function shouldIgnoreEnvFile(fileName: string): boolean {
	const baseName = path.basename(fileName).toLowerCase();
	return IGNORED_ENV_FILES.some((ignored) => baseName === ignored.toLowerCase());
}

async function getPackageJsonSignature(workspacePath: string): Promise<string | undefined> {
	try {
		const pkgPath = path.join(workspacePath, 'package.json');
		if (!fs.existsSync(pkgPath)) {
			return undefined;
		}
		const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
		const base = `${pkg.name}@${pkg.version}`;
		return pkg.repository?.url ? `${base}:${normalizeGitUrl(pkg.repository.url)}` : base;
	} catch {
		return undefined;
	}
}

async function getStableFileStructure(workspacePath: string): Promise<string> {
	const keyFiles = new Set([
		'package.json', 'package-lock.json', 'yarn.lock',
		'requirements.txt', 'pyproject.toml', 'setup.py',
		'cargo.toml', 'go.mod', 'composer.json',
	]);
	const keyDirs = new Set(['src', 'lib', 'app', 'api', 'config', 'scripts']);
	const parts: string[] = [];

	function scan(dir: string, relative = '', depth = 0): void {
		if (depth > 3) {
			return;
		}
		try {
			for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
				if (item.name.startsWith('.') || item.name === 'node_modules' ||
					item.name === 'dist' || item.name === 'build') {
					continue;
				}
				const relPath = path.join(relative, item.name);
				const name = item.name.toLowerCase();
				if (item.isDirectory() && keyDirs.has(name)) {
					parts.push(`dir:${relPath}`);
					scan(path.join(dir, item.name), relPath, depth + 1);
				} else if (item.isFile() && keyFiles.has(name)) {
					parts.push(`file:${relPath}`);
				}
			}
		} catch {
			// ignore permission errors
		}
	}

	scan(workspacePath);
	return parts.sort().join('\n');
}

async function getProjectContentSignature(workspacePath: string): Promise<string> {
	const pkgSig = await getPackageJsonSignature(workspacePath);
	if (pkgSig) {
		return `pkg:${pkgSig}`;
	}
	const structure = await getStableFileStructure(workspacePath);
	return `struct:${crypto.createHash('sha256').update(structure).digest('hex')}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getWorkspacePath(): Promise<string | undefined> {
	return WorkspaceContextProvider.getInstance().getWorkspaceContext().primaryPath;
}

/**
 * Returns all configured Git remotes for a workspace as a name→url map.
 * Uses execFile throughout to prevent shell injection on remote names.
 * Falls back to parsing .git/config directly when git is unavailable.
 */
export async function getAllGitRemotes(workspacePath: string): Promise<Map<string, string>> {
	const remotes = new Map<string, string>();

	try {
		const { stdout } = await execFileAsync('git', ['remote'], { cwd: workspacePath });
		const names = stdout.trim().split('\n').filter(Boolean);

		await Promise.allSettled(
			names.map(async (name) => {
				try {
					const { stdout: url } = await execFileAsync(
						'git', ['remote', 'get-url', name], { cwd: workspacePath }
					);
					remotes.set(name, url.trim());
				} catch {
					// skip unreadable remotes
				}
			})
		);
	} catch {
		// Fall back to parsing .git/config directly
		const configPath = path.join(workspacePath, '.git', 'config');
		if (fs.existsSync(configPath)) {
			const gitConfig = fs.readFileSync(configPath, 'utf-8');
			const remoteRegex = /\[remote "([^"]+)"\][\s\S]*?url\s*=\s*(.+?)(?=\n\[|$)/g;
			let match;
			while ((match = remoteRegex.exec(gitConfig)) !== null) {
				remotes.set(match[1], match[2].trim());
			}
		}
	}

	return remotes;
}

export async function getGitRemote(workspacePath: string): Promise<GitRemoteResult | undefined> {
	if (!fs.existsSync(path.join(workspacePath, '.git'))) {
		return undefined;
	}

	const submodule = detectSubmodule(workspacePath);
	if (submodule.isSubmodule && submodule.parentPath) {
		const parent = await getGitRemote(submodule.parentPath);
		if (parent) {
			return { remoteUrl: parent.remoteUrl, type: 'submodule', parentRemote: parent.remoteUrl };
		}
	}

	const worktree = detectWorktree(workspacePath);
	if (worktree.isWorktree && worktree.mainRepoPath) {
		const main = await getGitRemote(worktree.mainRepoPath);
		if (main) {
			return { remoteUrl: main.remoteUrl, type: 'worktree', parentRemote: main.remoteUrl };
		}
	}

	const best = selectBestRemote(await getAllGitRemotes(workspacePath));
	return best ? { remoteUrl: best.url, type: 'normal' } : undefined;
}

/** Returns just the raw remote URL string (convenience wrapper). */
export async function getGitRemoteUrl(workspacePath: string): Promise<string | undefined> {
	return (await getGitRemote(workspacePath))?.remoteUrl;
}

export async function getNormalizedGitRemote(workspacePath: string): Promise<string | undefined> {
	const result = await getGitRemote(workspacePath);
	return result ? normalizeGitUrl(result.remoteUrl) : undefined;
}

export async function detectMonorepoStructure(workspacePath: string): Promise<string[]> {
	const subProjects: string[] = [];

	try {
		const monorepoMarkers = ['lerna.json', 'nx.json', 'pnpm-workspace.yaml', 'rush.json'];
		const hasMarkers = monorepoMarkers.some((f) => fs.existsSync(path.join(workspacePath, f)));

		let hasWorkspaces = false;
		const rootPkg = path.join(workspacePath, 'package.json');
		if (fs.existsSync(rootPkg)) {
			try {
				const pkg = JSON.parse(fs.readFileSync(rootPkg, 'utf8'));
				hasWorkspaces = !!(pkg.workspaces || pkg.workspace);
			} catch { /* ignore */ }
		}

		if (!hasMarkers && !hasWorkspaces) {return [];}

		function scan(dir: string, relative = '', depth = 0): void {
			if (depth > 3) {return;}
			try {
				for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
					if (entry.name.startsWith('.') || entry.name === 'node_modules') {continue;}
					if (!entry.isDirectory()) {continue;}

					const fullPath = path.join(dir, entry.name);
					const relPath = path.join(relative, entry.name);
					const pkgPath = path.join(fullPath, 'package.json');

					if (fs.existsSync(pkgPath)) {
						try {
							const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
							if (pkg.name && pkg.version) {subProjects.push(relPath);}
						} catch { /* ignore invalid package.json */ }
					} else {
						scan(fullPath, relPath, depth + 1);
					}
				}
			} catch { /* ignore directory read errors */ }
		}

		scan(workspacePath);
	} catch { /* ignore top-level errors */ }

	return subProjects.sort();
}

export async function computeStableRepoId(
	identifier: string,
	subProjectPath?: string
): Promise<string> {
	const input = subProjectPath ? `${identifier}:${subProjectPath}` : identifier;
	return crypto.createHash('sha256').update(input).digest('hex');
}

export function computeEnvId(repoId: string, fileName: string): string {
	return crypto.createHash('sha256').update(`${repoId}:${fileName}`).digest('hex');
}

/**
 * Resolves the current workspace's repo identity using a priority chain:
 *   1. Manual override stored by the user
 *   2. Live Git remote (normalized)
 *   3. Stored Git remote history (offline / remote-less workspaces)
 *   4. Content signature (package.json or file-structure hash)
 */
export async function getCurrentWorkspaceId(
	context?: vscode.ExtensionContext,
	logger?: Logger
): Promise<WorkspaceIdentity | undefined> {
	const workspacePath = await getWorkspacePath();
	if (!workspacePath) {
		logger?.debug('getCurrentWorkspaceId: no workspace path');
		return undefined;
	}

	logger?.debug(`Resolving identity for: ${workspacePath}`);

	const identityStore = context ? new RepoIdentityStore(context) : null;
	const storedIdentity = identityStore?.getRepoIdentity(workspacePath) ?? null;
	const subProjectPath = storedIdentity?.subProjectPath;

	// ── Priority 1: Manual override ────────────────────────────────────────────
	if (storedIdentity?.manualIdentity) {
		logger?.debug('Using manual identity override');
		const repoId = await computeStableRepoId(storedIdentity.manualIdentity, subProjectPath);
		return { repoId, identitySource: 'manual', subProjectPath, workspacePath };
	}

	// ── Priority 2: Live Git remote ────────────────────────────────────────────
	const gitRemoteResult = await getGitRemote(workspacePath);
	if (gitRemoteResult) {
		const normalizedRemote = normalizeGitUrl(gitRemoteResult.remoteUrl);
		logger?.debug(`Using Git remote: ${normalizedRemote} (${gitRemoteResult.type})`);

		if (identityStore) {
			await identityStore.updateGitRemote(workspacePath, gitRemoteResult.remoteUrl, normalizedRemote);
		}

		const repoId = await computeStableRepoId(normalizedRemote, subProjectPath);
		return {
			repoId,
			identitySource: 'git',
			gitRemote: normalizedRemote,
			gitRemoteUrl: gitRemoteResult.remoteUrl,
			gitRemoteType: gitRemoteResult.type,
			subProjectPath,
			workspacePath,
			...buildMigrationInfo(
				storedIdentity?.lastActiveRepoId,
				repoId,
				'Git remote detected or changed'
			),
		};
	}

	// ── Priority 3: Stored Git remote history ──────────────────────────────────
	const storedGitRemote = identityStore?.getMostRecentGitRemote(workspacePath) ?? null;
	if (storedGitRemote) {
		logger?.debug(`Using stored Git remote: ${storedGitRemote.normalizedUrl}`);
		const repoId = await computeStableRepoId(storedGitRemote.normalizedUrl, subProjectPath);
		return {
			repoId,
			identitySource: 'stored-git',
			gitRemote: storedGitRemote.normalizedUrl,
			gitRemoteUrl: storedGitRemote.url,
			subProjectPath,
			workspacePath,
			...buildMigrationInfo(
				storedIdentity?.lastActiveRepoId,
				repoId,
				'Using stored Git remote history'
			),
		};
	}

	// ── Priority 4: Content signature ──────────────────────────────────────────
	logger?.debug('Falling back to content signature');
	const contentSignature = await getProjectContentSignature(workspacePath);
	const availableSubProjects = await detectMonorepoStructure(workspacePath);
	const effectiveSubPath = availableSubProjects.length > 0 ? subProjectPath : undefined;
	const repoId = await computeStableRepoId(contentSignature, effectiveSubPath);

	logger?.debug(`Content signature repoId: ${repoId}`);

	return {
		repoId,
		identitySource: 'content',
		subProjectPath: effectiveSubPath,
		workspacePath,
		monorepoDetected: availableSubProjects.length > 0,
		availableSubProjects: availableSubProjects.length > 0 ? availableSubProjects : undefined,
		...buildMigrationInfo(
			storedIdentity?.lastActiveRepoId,
			repoId,
			'Content signature changed'
		),
	};
}

/**
 * Returns the repoId, envId, gitRemote, and workspacePath for a given env file.
 * Returns undefined when no workspace is open.
 *
 * @param fileName - Workspace-relative path (e.g. "apps/api/.env" or ".env")
 * @param context  - Extension context for persistent identity storage
 */
export async function getRepoAndEnvIds(
	fileName: string,
	context?: vscode.ExtensionContext
): Promise<{ repoId: string; envId: string; gitRemote: string | undefined; workspacePath: string } | undefined> {
	const workspace = await getCurrentWorkspaceId(context);
	if (!workspace) {return undefined;}
	return {
		repoId: workspace.repoId,
		envId: computeEnvId(workspace.repoId, fileName),
		gitRemote: workspace.gitRemote,
		workspacePath: workspace.workspacePath,
	};
}

/**
 * Retrieves all .env* files in the workspace using VS Code's native file search.
 * Automatically respects .gitignore, files.exclude, and search.exclude.
 */
export async function getAllEnvFiles(logger?: Logger): Promise<string[]> {
	const wsContext = WorkspaceContextProvider.getInstance().getWorkspaceContext();

	if (wsContext.mode === 'none' || !wsContext.primaryPath) {
		logger?.debug('No workspace open, skipping env file scan');
		return [];
	}

	if (logger) {
		const validator = WorkspaceValidator.getInstance(logger);
		if (!(await validator.validateAndPromptIfNeeded(wsContext.primaryPath))) {
			logger.warn('Workspace validation failed or user cancelled');
			return [];
		}
	}

	try {
		const uris = await vscode.workspace.findFiles(
			ENV_FILE_INCLUDE_PATTERN,
			ENV_FILE_EXCLUDE_PATTERN
		);

		logger?.debug(`Found ${uris.length} raw env files`);

		const relativePaths = uris
			.map((uri) => vscode.workspace.asRelativePath(uri))
			.filter((rel) => {
				const normalized = normalizeEnvFilePath(rel);
				const ignored = shouldIgnoreEnvFile(normalized);
				const valid = isValidEnvFilePath(normalized);
				if (ignored) {logger?.debug(`Ignoring ${normalized} (ignore list)`);}
				if (!valid) {logger?.debug(`Ignoring ${normalized} (invalid filename)`);}
				return !ignored && valid;
			})
			.sort();

		logger?.debug(`${relativePaths.length} env files after filtering`);
		return relativePaths;
	} catch (error) {
		logger?.error(`Failed to scan workspace: ${formatError(error)}`);
		return [];
	}
}
