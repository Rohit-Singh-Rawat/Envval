// repoDetector.ts
import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { IGNORED_ENV_FILES } from '../lib/constants';
import { RepoIdentityStore } from '../services/repo-identity-store';
import type { Logger } from '../utils/logger';

const execAsync = promisify(exec);

/**
 * Helper function to log messages using logger or console as fallback
 */
function logMessage(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'debug', logger?: Logger): void {
  if (logger) {
    switch (level) {
      case 'debug':
        logger.debug(message);
        break;
      case 'info':
        logger.info(message);
        break;
      case 'warn':
        logger.warn(message);
        break;
      case 'error':
        logger.error(message);
        break;
    }
  } else {
    console.log(`[RepoDetection] ${message}`);
  }
}

/**
 * Enhanced workspace identity return type
 */
interface WorkspaceIdentity {
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


export async function getWorkspacePath(): Promise<string | undefined> {
  const folders = vscode.workspace.workspaceFolders;
  return folders?.[0]?.uri.fsPath;
}

/**
 * Enhanced Git remote detection result
 */
interface GitRemoteResult {
  remoteUrl: string;
  type: 'normal' | 'submodule' | 'worktree';
  parentRemote?: string;
}

/**
 * Get all configured Git remotes as a map
 */
export async function getAllGitRemotes(workspacePath: string): Promise<Map<string, string>> {
  const remotes = new Map<string, string>();

  try {
    // Try git command first
    const { stdout } = await execAsync('git remote', { cwd: workspacePath });
    const remoteNames = stdout.trim().split('\n').filter(name => name.length > 0);

    for (const name of remoteNames) {
      try {
        const { stdout: url } = await execAsync(`git remote get-url ${name}`, { cwd: workspacePath });
        remotes.set(name, url.trim());
      } catch {
        // Skip remotes that can't be read
      }
    }
  } catch {
    // Fall back to parsing .git/config
    const gitConfigPath = path.join(workspacePath, '.git', 'config');
    if (fs.existsSync(gitConfigPath)) {
      const gitConfig = fs.readFileSync(gitConfigPath, 'utf-8');
      const remoteRegex = /\[remote "([^"]+)"\][\s\S]*?url\s*=\s*(.+?)(?=\n\[|$)/g;

      let match;
      while ((match = remoteRegex.exec(gitConfig)) !== null) {
        const [, name, url] = match;
        remotes.set(name, url.trim());
      }
    }
  }

  return remotes;
}

/**
 * Detect if workspace is a Git submodule
 */
function detectSubmodule(workspacePath: string): { isSubmodule: boolean; parentPath?: string } {
  const gitFile = path.join(workspacePath, '.git');

  // Check if .git is a file (indicates submodule)
  if (fs.existsSync(gitFile) && fs.statSync(gitFile).isFile()) {
    try {
      const gitContent = fs.readFileSync(gitFile, 'utf-8').trim();
      // Parse gitdir reference (e.g., "gitdir: ../.git/modules/submodule")
      const gitdirMatch = gitContent.match(/^gitdir:\s*(.+)$/);
      if (gitdirMatch) {
        const gitdirPath = path.resolve(workspacePath, gitdirMatch[1]);
        // Parent repo is typically one level up from modules directory
        const parentPath = path.dirname(path.dirname(gitdirPath));
        return { isSubmodule: true, parentPath };
      }
    } catch {
      // Ignore read errors
    }
  }

  return { isSubmodule: false };
}

/**
 * Detect if workspace is a Git worktree
 */
function detectWorktree(workspacePath: string): { isWorktree: boolean; mainRepoPath?: string } {
  const gitFile = path.join(workspacePath, '.git');

  // Check if .git is a file (could be worktree)
  if (fs.existsSync(gitFile) && fs.statSync(gitFile).isFile()) {
    try {
      const gitContent = fs.readFileSync(gitFile, 'utf-8').trim();
      // Parse gitdir reference for worktrees
      const gitdirMatch = gitContent.match(/^gitdir:\s*(.+)$/);
      if (gitdirMatch) {
        const gitdirPath = path.resolve(workspacePath, gitdirMatch[1]);
        // Check if this is a worktree by looking for worktrees directory structure
        const worktreesDir = path.dirname(gitdirPath);
        if (path.basename(worktreesDir) === 'worktrees') {
          const mainGitDir = path.dirname(worktreesDir);
          return { isWorktree: true, mainRepoPath: path.dirname(mainGitDir) };
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  return { isWorktree: false };
}

/**
 * Select the best remote from available remotes based on priority
 */
function selectBestRemote(remotes: Map<string, string>): { name: string; url: string } | undefined {
  const priorityOrder = ['origin', 'upstream'];

  // Check priority remotes first
  for (const priorityName of priorityOrder) {
    const url = remotes.get(priorityName);
    if (url) {
      return { name: priorityName, url };
    }
  }

  // Fall back to first available remote
  const firstEntry = remotes.entries().next();
  if (!firstEntry.done) {
    const [name, url] = firstEntry.value;
    return { name, url };
  }

  return undefined;
}

/**
 * Enhanced Git remote detection with support for multiple remotes, submodules, and worktrees
 */
export async function getGitRemote(workspacePath: string): Promise<GitRemoteResult | undefined> {
  // Check if this is a submodule
  const submoduleInfo = detectSubmodule(workspacePath);
  if (submoduleInfo.isSubmodule && submoduleInfo.parentPath) {
    // For submodules, get parent's remote
    const parentRemote = await getGitRemote(submoduleInfo.parentPath);
    if (parentRemote) {
      return {
        remoteUrl: parentRemote.remoteUrl,
        type: 'submodule',
        parentRemote: parentRemote.remoteUrl
      };
    }
  }

  // Check if this is a worktree
  const worktreeInfo = detectWorktree(workspacePath);
  if (worktreeInfo.isWorktree && worktreeInfo.mainRepoPath) {
    // For worktrees, use main repo's remote
    const mainRemote = await getGitRemote(worktreeInfo.mainRepoPath);
    if (mainRemote) {
      return {
        remoteUrl: mainRemote.remoteUrl,
        type: 'worktree',
        parentRemote: mainRemote.remoteUrl
      };
    }
  }

  // Get all remotes and select the best one
  const allRemotes = await getAllGitRemotes(workspacePath);
  const bestRemote = selectBestRemote(allRemotes);

  if (bestRemote) {
    return {
      remoteUrl: bestRemote.url,
      type: 'normal'
    };
  }

  return undefined;
}

/**
 * Legacy function for backward compatibility - returns just the URL string
 */
export async function getGitRemoteUrl(workspacePath: string): Promise<string | undefined> {
  const result = await getGitRemote(workspacePath);
  return result?.remoteUrl;
}

/**
 * Normalize Git URLs to consistent format for stable repo identification
 */
function normalizeGitUrl(url: string): string {
  // Remove .git suffix
  let normalized = url.replace(/\.git$/, '');

  // Convert SSH format to HTTPS
  const sshMatch = normalized.match(/^git@(.+?):(.+)$/);
  if (sshMatch) {
    const [, host, path] = sshMatch;
    normalized = `https://${host}/${path}`;
  }

  // Remove protocol and www prefix for consistency
  normalized = normalized
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '');

  // Ensure consistent trailing slash removal
  normalized = normalized.replace(/\/$/, '');

  return normalized.toLowerCase();
}

/**
 * Get normalized Git remote URL for stable identification
 */
export async function getNormalizedGitRemote(workspacePath: string): Promise<string | undefined> {
  const remoteResult = await getGitRemote(workspacePath);
  if (!remoteResult) {
    return undefined;
  }
  return normalizeGitUrl(remoteResult.remoteUrl);
}

/**
 * Get package.json-based signature for project identification
 */
async function getPackageJsonSignature(workspacePath: string): Promise<string | undefined> {
  try {
    const packagePath = path.join(workspacePath, 'package.json');
    if (!fs.existsSync(packagePath)) {
      return undefined;
    }

    const content = fs.readFileSync(packagePath, 'utf8');
    const pkg = JSON.parse(content);

    // Use name + version as base identifier
    const baseId = `${pkg.name}@${pkg.version}`;

    // Include repository URL if available for additional stability
    if (pkg.repository?.url) {
      const normalizedRepo = normalizeGitUrl(pkg.repository.url);
      return `${baseId}:${normalizedRepo}`;
    }

    return baseId;
  } catch {
    return undefined;
  }
}

/**
 * Get sorted project entries for stable hashing
 */
async function getSortedProjectEntries(workspacePath: string): Promise<Array<{type: 'file' | 'dir', relativePath: string}>> {
  const entries: Array<{type: 'file' | 'dir', relativePath: string}> = [];

  function scanDir(dir: string, relativePath: string = ''): void {
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        // Skip common irrelevant directories
        if (item.name.startsWith('.') ||
            item.name === 'node_modules' ||
            item.name === 'dist' ||
            item.name === 'build' ||
            item.name === '.git') {
          continue;
        }

        const itemRelativePath = path.join(relativePath, item.name);

        if (item.isDirectory()) {
          entries.push({ type: 'dir', relativePath: itemRelativePath });
          // Recursively scan but limit depth to avoid huge structures
          if (relativePath.split(path.sep).length < 3) {
            scanDir(path.join(dir, item.name), itemRelativePath);
          }
        } else if (item.isFile()) {
          entries.push({ type: 'file', relativePath: itemRelativePath });
        }
      }
    } catch {
      // Ignore permission errors
    }
  }

  scanDir(workspacePath);
  return entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

/**
 * Check if a file/directory should be included in signature
 */
function shouldIncludeInSignature(entry: {type: 'file' | 'dir', relativePath: string}): boolean {
  const name = path.basename(entry.relativePath).toLowerCase();

  // Include key project files
  const keyFiles = [
    'package.json', 'package-lock.json', 'yarn.lock',
    'requirements.txt', 'pyproject.toml', 'setup.py',
    'cargo.toml', 'go.mod', 'composer.json',
    'readme.md', 'readme.txt', 'readme'
  ];

  // Include key directories (but not their contents for stability)
  const keyDirs = [
    'src', 'lib', 'app', 'api', 'config', 'scripts'
  ];

  if (entry.type === 'file') {
    return keyFiles.includes(name) ||
           name.endsWith('.md') && name.startsWith('readme');
  } else {
    return keyDirs.includes(name);
  }
}

/**
 * Get stable file structure signature for project identification
 */
async function getStableFileStructure(workspacePath: string): Promise<string> {
  const entries = await getSortedProjectEntries(workspacePath);
  const signatureParts: string[] = [];

  for (const entry of entries) {
    if (shouldIncludeInSignature(entry)) {
      signatureParts.push(`${entry.type}:${entry.relativePath}`);
    }
  }

  return signatureParts.join('\n');
}

/**
 * Get project content signature for automatic repo identification
 */
async function getProjectContentSignature(workspacePath: string): Promise<string> {
  // Priority 1: package.json (most stable and meaningful)
  const packageSignature = await getPackageJsonSignature(workspacePath);
  if (packageSignature) {
    return `pkg:${packageSignature}`;
  }

  // Priority 2: Stable file structure hash
  const fileStructure = await getStableFileStructure(workspacePath);
  return `struct:${crypto.createHash('sha256').update(fileStructure).digest('hex')}`;
}

/**
 * Detect monorepo structure and return potential sub-project paths
 */
export async function detectMonorepoStructure(workspacePath: string): Promise<string[]> {
  const subProjects: string[] = [];

  try {
    // Check for monorepo indicator files
    const monorepoIndicators = [
      'lerna.json',
      'nx.json',
      'pnpm-workspace.yaml',
      'rush.json'
    ];

    const hasMonorepoIndicators = monorepoIndicators.some(indicator =>
      fs.existsSync(path.join(workspacePath, indicator))
    );

    // Check for workspaces in package.json
    const rootPackageJson = path.join(workspacePath, 'package.json');
    let hasWorkspaces = false;

    if (fs.existsSync(rootPackageJson)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(rootPackageJson, 'utf8'));
        hasWorkspaces = !!(pkg.workspaces || pkg.workspace);
      } catch {
        // Ignore JSON parse errors
      }
    }

    // If we found monorepo indicators or workspaces, scan for sub-projects
    if (hasMonorepoIndicators || hasWorkspaces) {
      const scanForSubProjects = (dir: string, relativePath: string = '', depth: number = 0): void => {
        if (depth > 3) {
          return; // Limit depth to avoid excessive scanning
        }

        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });

          for (const entry of entries) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules') {
              continue;
            }

            const fullPath = path.join(dir, entry.name);
            const relPath = path.join(relativePath, entry.name);

            if (entry.isDirectory()) {
              // Check if this directory has a package.json (indicates a sub-project)
              const pkgPath = path.join(fullPath, 'package.json');
              if (fs.existsSync(pkgPath)) {
                // Verify it's not just a dependency by checking if it has name/version
                try {
                  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                  if (pkg.name && pkg.version) {
                    subProjects.push(relPath);
                  }
                } catch {
                  // Ignore invalid package.json
                }
              } else {
                // Continue scanning subdirectories (but limit depth)
                scanForSubProjects(fullPath, relPath, depth + 1);
              }
            }
          }
        } catch {
          // Ignore directory read errors
        }
      };

      scanForSubProjects(workspacePath);
    }
  } catch {
    // Ignore errors during monorepo detection
  }

  return subProjects.sort();
}

/**
 * Compute stable repo ID from any identifier string
 */
export async function computeStableRepoId(
  identifier: string,
  userId?: string,
  subProjectPath?: string
): Promise<string> {
  let input = identifier;

  if (subProjectPath) {
    input = `${identifier}:${subProjectPath}`;
  }

  if (userId) {
    input = `${input}:${userId}`;
  }

  return crypto.createHash('sha256').update(input).digest('hex');
}

export function computeEnvId(repoId: string, fileName: string): string {
  return crypto.createHash('sha256').update(`${repoId}:${fileName}`).digest('hex');
}

/**
 * Get the current workspace identity using enhanced multi-layered detection.
 * Implements priority chain with persistent storage and migration support.
 */
export async function getCurrentWorkspaceId(
  userId?: string,
  context?: vscode.ExtensionContext,
  logger?: Logger
): Promise<WorkspaceIdentity | undefined> {
  const workspacePath = await getWorkspacePath();
  if (!workspacePath) {
    logMessage('No workspace path found', 'debug', logger);
    return undefined;
  }

  logMessage(`Starting detection for workspace: ${workspacePath}`, 'debug', logger);

  // Initialize repo identity store if context provided
  const identityStore = context ? new RepoIdentityStore(context) : null;
  const storedIdentity = identityStore ? identityStore.getRepoIdentity(workspacePath) : null;

  logMessage(`Stored identity data: ${storedIdentity ? 'found' : 'not found'}`, 'debug', logger);

  // Priority 1: Manual Override
  if (storedIdentity?.manualIdentity) {
    logMessage('Priority 1: Using manual identity override', 'debug', logger);
    logMessage(`Manual identity: ${storedIdentity.manualIdentity}`, 'debug', logger);
    const repoId = await computeStableRepoId(storedIdentity.manualIdentity, userId, storedIdentity.subProjectPath);
    logMessage(`Computed repoId: ${repoId}`, 'debug', logger);
    return {
      repoId,
      identitySource: 'manual',
      subProjectPath: storedIdentity.subProjectPath,
      workspacePath
    };
  }

  // Priority 2: Git Remote (Normalized)
  logMessage('Priority 2: Checking Git remote', 'debug', logger);
  const gitRemoteResult = await getGitRemote(workspacePath);
  if (gitRemoteResult) {
    const normalizedRemote = normalizeGitUrl(gitRemoteResult.remoteUrl);
    logMessage(`Found Git remote: ${normalizedRemote} (type: ${gitRemoteResult.type})`, 'debug', logger);

    // Update stored Git remote history
    if (identityStore) {
      await identityStore.updateGitRemote(workspacePath, gitRemoteResult.remoteUrl, normalizedRemote);
      logMessage('Updated Git remote history', 'debug', logger);
    }

    // Check for monorepo sub-project
    let subProjectPath: string | undefined;
    if (storedIdentity?.subProjectPath) {
      subProjectPath = storedIdentity.subProjectPath;
      logMessage(`Using stored sub-project path: ${subProjectPath}`, 'debug', logger);
    }

    const repoId = await computeStableRepoId(normalizedRemote, userId, subProjectPath);
    logMessage(`Computed repoId from Git remote: ${repoId}`, 'debug', logger);

    return {
      repoId,
      identitySource: 'git',
      gitRemote: normalizedRemote,
      gitRemoteUrl: gitRemoteResult.remoteUrl,
      gitRemoteType: gitRemoteResult.type,
      subProjectPath,
      workspacePath
    };
  } else {
    logMessage('No Git remote found', 'debug', logger);
  }

  // Priority 3: Stored Git Remote History
  logMessage('Priority 3: Checking stored Git remote history', 'debug', logger);
  const storedGitRemote = identityStore ? identityStore.getMostRecentGitRemote(workspacePath) : null;
  if (storedGitRemote) {
    logMessage(`Found stored Git remote: ${(storedGitRemote as { url: string; normalizedUrl: string }).normalizedUrl}`, 'debug', logger);
    let subProjectPath: string | undefined;
    if (storedIdentity?.subProjectPath) {
      subProjectPath = storedIdentity.subProjectPath;
      logMessage(`Using stored sub-project path: ${subProjectPath}`, 'debug', logger);
    }

    const repoId = await computeStableRepoId(storedGitRemote.normalizedUrl, userId, subProjectPath);
    logMessage(`Computed repoId from stored Git remote: ${repoId}`, 'debug', logger);

    return {
      repoId,
      identitySource: 'stored-git',
      gitRemote: storedGitRemote.normalizedUrl,
      gitRemoteUrl: storedGitRemote.url,
      subProjectPath,
      workspacePath
    };
  } else {
    logMessage('No stored Git remote history found', 'debug', logger);
  }

  // Priority 4: Content Signature
  logMessage('Priority 4: Generating content signature', 'debug', logger);
  const contentSignature = await getProjectContentSignature(workspacePath);
  logMessage(`Content signature: ${contentSignature}`, 'debug', logger);

  let subProjectPath: string | undefined;

  // Check for monorepo and sub-project
  logMessage('Checking for monorepo structure', 'debug', logger);
  const availableSubProjects = await detectMonorepoStructure(workspacePath);
  logMessage(`Monorepo detection: ${availableSubProjects.length} sub-projects found`, 'debug', logger);

  if (availableSubProjects.length > 0) {
    if (storedIdentity?.subProjectPath) {
      subProjectPath = storedIdentity.subProjectPath;
      logMessage(`Using stored sub-project path: ${subProjectPath}`, 'debug', logger);
    } else {
      logMessage('Monorepo detected but no sub-project path stored', 'debug', logger);
    }
  }

  const repoId = await computeStableRepoId(contentSignature, userId, subProjectPath);
  logMessage(`Computed repoId from content signature: ${repoId}`, 'debug', logger);

  // Check for migration: if we have a stored Git remote but are now using content signature
  let requiresMigration = false;
  let suggestedMigration: WorkspaceIdentity['suggestedMigration'];

  if (storedGitRemote) {
    logMessage('Checking for migration opportunity', 'debug', logger);
    // Calculate what the Git-based repoId would be
    const gitBasedRepoId = await computeStableRepoId((storedGitRemote as { url: string; normalizedUrl: string }).normalizedUrl, userId, subProjectPath);
    logMessage(`Potential Git-based repoId: ${gitBasedRepoId}`, 'debug', logger);

    if (gitBasedRepoId !== repoId) {
      requiresMigration = true;
      suggestedMigration = {
        oldRepoId: repoId,
        newRepoId: gitBasedRepoId,
        reason: 'Git remote detected after using content signature'
      };
      logMessage(`Migration recommended: ${repoId} → ${gitBasedRepoId}`, 'info', logger);
    } else {
      logMessage('No migration needed (repoIds match)', 'debug', logger);
    }
  }

  logMessage(`Final result - Source: content, RepoId: ${repoId}`, 'debug', logger);
  return {
    repoId,
    identitySource: 'content',
    subProjectPath,
    workspacePath,
    requiresMigration,
    suggestedMigration,
    monorepoDetected: availableSubProjects.length > 0,
    availableSubProjects: availableSubProjects.length > 0 ? availableSubProjects : undefined
  };
}

/**
 * Legacy function for backward compatibility
 */
export async function getCurrentWorkspaceIdLegacy(
  userId?: string,
  context?: vscode.ExtensionContext
): Promise<{ repoId: string; gitRemote: string | undefined; workspacePath: string } | undefined> {
  const result = await getCurrentWorkspaceId(userId, context);
  if (!result) {
    return undefined;
  }

  return {
    repoId: result.repoId,
    gitRemote: result.gitRemote,
    workspacePath: result.workspacePath
  };
}

/**
 * Get repoId and envId for the current workspace and a given file.
 * Returns undefined if no workspace is open.
 * @param fileName The basename of the environment file (e.g. ".env")
 * @param userId Optional userId to include in ID computation
 * @param context Extension context for persistent storage access
 */
export async function getRepoAndEnvIds(
  fileName: string,
  userId?: string,
  context?: vscode.ExtensionContext
): Promise<{ repoId: string; envId: string; gitRemote: string | undefined; workspacePath: string } | undefined> {
  const workspace = await getCurrentWorkspaceId(userId, context);
  if (!workspace) {
    return undefined;
  }
  const envId = computeEnvId(workspace.repoId, fileName);
  return { repoId: workspace.repoId, envId, gitRemote: workspace.gitRemote, workspacePath: workspace.workspacePath };
}

/**
 * Check if an env file should be ignored.
 */
function shouldIgnoreEnvFile(fileName: string): boolean {
  const baseName = path.basename(fileName).toLowerCase();
  return IGNORED_ENV_FILES.some(ignored => baseName === ignored.toLowerCase());
}

/**
 * Retrieves all environment files (.env*) within the workspace.
 * 
 * This function performs a manual recursive scan of the filesystem to ensure it discovers 
 * files typically excluded from version control (via .gitignore). It specifically avoids 
 * scanning 'node_modules' and hidden directories to optimize performance and prevent 
 * noise from dependency configurations or system files.
 * 
 * @returns A promise that resolves to a sorted array of relative file paths.
 */
export async function getAllEnvFiles(): Promise<string[]> {
  const workspacePath = await getWorkspacePath();
  if (!workspacePath) {
    return [];
  }

  const envFiles: string[] = [];

  /**
   * Internal recursive helper for filesystem traversal.
   */
  const findEnvFiles = (dir: string, relativePath: string = ''): void => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const relPath = path.join(relativePath, entry.name);
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Standard optimization: skip dependencies and hidden system/config directories
          if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
            continue;
          }
          findEnvFiles(fullPath, relPath);
        } else if (entry.isFile()) {
          // Match .env or .env.suffix patterns while avoiding example/template files
          const isEnvFile = entry.name === '.env' || entry.name.startsWith('.env.');
          if (isEnvFile && !shouldIgnoreEnvFile(entry.name)) {
            envFiles.push(relPath);
          }
        }
      }
    } catch (error) {
      logMessage(`Error accessing directory ${dir}: ${error}`, 'warn');
    }
  };

  findEnvFiles(workspacePath);
  return envFiles.sort();
}
