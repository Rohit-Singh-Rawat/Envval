import * as path from "path";
import * as vscode from "vscode";

interface PathValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
}

const PATH_TRAVERSAL_PATTERNS = ["../", "..\\", "%2e%2e%2f", "%2e%2e%5c"];

/**
 * Validates that a file path stays within workspace boundaries.
 * Prevents directory traversal attacks when reading/writing env files.
 */
export function validateFilePath(
  filePath: string,
  workspacePath: string,
): PathValidationResult {
  try {
    const absoluteFile = path.resolve(filePath);
    const absoluteWorkspace = path.resolve(workspacePath);
    const relative = path.relative(absoluteWorkspace, absoluteFile);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      return { isValid: false, error: "Path is outside workspace boundary" };
    }

    for (const pattern of PATH_TRAVERSAL_PATTERNS) {
      if (filePath.includes(pattern)) {
        return { isValid: false, error: "Path traversal detected" };
      }
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: "Invalid path" };
  }
}

/**
 * Resolves a file URI to a forward-slash-normalized workspace-relative path.
 * Used as the canonical fileName across the sync pipeline so that
 * identically-named env files in different subdirectories (e.g. apps/api/.env
 * vs apps/web/.env) produce distinct identifiers.
 *
 * Falls back to basename when no workspace folder is open.
 */
export function toWorkspaceRelativePath(uri: vscode.Uri): string {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (workspaceRoot) {
    return path.relative(workspaceRoot, uri.fsPath).replace(/\\/g, "/");
  }
  return path.basename(uri.fsPath);
}
