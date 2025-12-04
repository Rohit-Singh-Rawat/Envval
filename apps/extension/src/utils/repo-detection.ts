// repoDetector.ts
import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { IGNORED_ENV_FILES } from '../lib/constants';

const execAsync = promisify(exec);


export async function getWorkspacePath(): Promise<string | undefined> {
  const folders = vscode.workspace.workspaceFolders;
  return folders?.[0]?.uri.fsPath;
}

export async function getGitRemote(workspacePath: string): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync('git remote get-url origin', { cwd: workspacePath });
    return stdout.trim();
  } catch {
    return undefined; // No git or no remote
  }
}

export async function computeRepoId(
  workspacePath: string,
  remoteUrl?: string,
  userId?: string
): Promise<string> {
  const input = `${remoteUrl || workspacePath}${userId ? `:${userId}` : ''}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function computeEnvId(repoId: string, fileName: string): string {
  return crypto.createHash('sha256').update(`${repoId}:${fileName}`).digest('hex');
}

/**
 * Get the current workspace repoId (with optional userId).
 * Falls back gracefully if no git remote is found.
 */
export async function getCurrentWorkspaceId(userId?: string): Promise<string | undefined> {
  const workspacePath = await getWorkspacePath();
  if (!workspacePath) {
    return undefined;
  }
  const gitRemote = await getGitRemote(workspacePath);
  const repoId = await computeRepoId(workspacePath, gitRemote, userId);
  return repoId;
}

/**
 * Get repoId and envId for the current workspace and a given file.
 * Returns undefined if no workspace is open.
 */
export async function getRepoAndEnvIds(
  fileName: string,
  userId?: string
): Promise<{ repoId: string; envId: string } | undefined> {
  const repoId = await getCurrentWorkspaceId(userId);
  if (!repoId) {
    return undefined;
  }
  const envId = computeEnvId(repoId, fileName);
  return { repoId, envId };
}

/**
 * Check if an env file should be ignored.
 */
function shouldIgnoreEnvFile(fileName: string): boolean {
  const baseName = path.basename(fileName).toLowerCase();
  return IGNORED_ENV_FILES.some(ignored => baseName === ignored.toLowerCase());
}

/**
 * Get all .env files in the workspace, respecting .gitignore and filtering out example/template files.
 * Returns an array of relative file paths.
 */
export async function getAllEnvFiles(): Promise<string[]> {
  const workspacePath = await getWorkspacePath();
  if (!workspacePath) {
    return [];
  }

  try {
    // Use git ls-files to respect .gitignore
    const { stdout } = await execAsync('git ls-files "*.env*"', { cwd: workspacePath });
    const gitTrackedFiles = stdout
      .trim()
      .split('\n')
      .filter(line => line.length > 0)
      .filter(file => !shouldIgnoreEnvFile(file));

    // Also check for untracked .env files that exist on disk
    const allEnvFiles = new Set<string>(gitTrackedFiles);
    
    // Recursively find .env files in workspace
    const findEnvFiles = (dir: string, relativePath: string = ''): void => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          // Skip node_modules and hidden directories
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }

          const fullPath = path.join(dir, entry.name);
          const relPath = path.join(relativePath, entry.name);

          if (entry.isDirectory()) {
            findEnvFiles(fullPath, relPath);
          } else if (entry.isFile() && entry.name.match(/^\.env(\..+)?$/) && !shouldIgnoreEnvFile(entry.name)) {
            allEnvFiles.add(relPath);
          }
        }
      } catch (error) {
        // Ignore permission errors or other file system errors
        console.warn(`Error reading directory ${dir}:`, error);
      }
    };

    findEnvFiles(workspacePath);

    return Array.from(allEnvFiles).sort();
  } catch (error) {
    // If git command fails, fall back to file system search only
    console.warn('Git command failed, falling back to file system search:', error);
    
    const envFiles: string[] = [];
    const findEnvFiles = (dir: string, relativePath: string = ''): void => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }

          const fullPath = path.join(dir, entry.name);
          const relPath = path.join(relativePath, entry.name);

          if (entry.isDirectory()) {
            findEnvFiles(fullPath, relPath);
          } else if (entry.isFile() && entry.name.match(/^\.env(\..+)?$/) && !shouldIgnoreEnvFile(entry.name)) {
            envFiles.push(relPath);
          }
        }
      } catch (error) {
        // Ignore errors
      }
    };

    findEnvFiles(workspacePath);
    return envFiles.sort();
  }
}
