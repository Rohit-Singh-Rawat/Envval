import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import {
  USER_HOME_SUBDIRS,
  WINDOWS_SYSTEM_DIRECTORIES,
  UNIX_SYSTEM_DIRECTORIES,
  PATH_TRAVERSAL_PATTERNS,
} from "../lib/workspace-limits";
import type { Logger } from "./logger";

export type UnsafeReason =
  | "root_drive"
  | "user_home_top"
  | "user_home_subdir"
  | "system_directory"
  | "safe";

export interface PathSafetyResult {
  isSafe: boolean;
  reason: UnsafeReason;
  suggestedAction?: string;
  estimatedFiles?: number;
}

export interface PathValidationOptions {
  /** Allow paths that are (or contain) a known user home subdirectory. Defaults to false. */
  allowUserHomeSubdirs?: boolean;
}

function log(
  message: string,
  level: "debug" | "info" | "warn" | "error",
  logger: Logger | undefined,
): void {
  logger?.[level](message);
}

function getHomeDir(): string {
  return path.normalize(os.homedir());
}

function pathsEqual(a: string, b: string): boolean {
  if (process.platform === "win32" || process.platform === "darwin") {
    return a.toLowerCase() === b.toLowerCase();
  }
  return a === b;
}

function isInsideOrEqual(fsPath: string, ancestor: string): boolean {
  const sep = path.sep;
  const normalize = (p: string) =>
    process.platform === "win32" || process.platform === "darwin"
      ? p.toLowerCase()
      : p;

  const a = normalize(fsPath);
  const b = normalize(ancestor);
  return a === b || a.startsWith(b.endsWith(sep) ? b : b + sep);
}

function isRootDrive(normalized: string): boolean {
  if (process.platform === "win32") {
    return /^[A-Za-z]:\\$/.test(normalized);
  }
  return normalized === "/";
}

function isUserHomeRoot(normalized: string): boolean {
  return pathsEqual(normalized, getHomeDir());
}

/**
 * Returns true only if the path IS exactly a known broad directory.
 * Any named folder inside it is treated as a valid project workspace.
 *
 * Walks every segment so cloud-sync redirects are caught at any depth:
 *   ~/Desktop                    → unsafe (is the broad dir)
 *   ~/OneDrive/Desktop           → unsafe (cloud-redirected broad dir)
 *   ~/Desktop/rsrCrafts          → safe   (named project folder)
 *   ~/Desktop/rsrCrafts/Env0     → safe   (specific project folder)
 *   ~/OneDrive/Desktop/proj/app  → safe   (specific project folder)
 *   ~/OneDrive/Projects/myapp    → safe   (no broad dir in chain)
 */
function isAncestorUnsafeSubdir(normalized: string): boolean {
  const homeDir = getHomeDir();
  const rel = path.relative(homeDir, normalized);

  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) {
    return false;
  }

  const segments = rel.split(path.sep);

  for (let i = 0; i < segments.length; i++) {
    const isBroadDir = USER_HOME_SUBDIRS.some(
      (dir) => dir.toLowerCase() === segments[i].toLowerCase(),
    );

    if (isBroadDir) {
      // Only unsafe if the path ends exactly at the broad dir itself.
      // Any named folder inside it is a valid project workspace.
      return segments.length - i - 1 === 0;
    }
  }

  return false;
}

function isSystemDirectory(normalized: string): boolean {
  const dirs =
    process.platform === "win32"
      ? WINDOWS_SYSTEM_DIRECTORIES
      : UNIX_SYSTEM_DIRECTORIES;
  return dirs.some((sysDir) =>
    isInsideOrEqual(normalized, path.normalize(sysDir)),
  );
}

/**
 * Validates a workspace path for safety before file scanning.
 *
 * Check pipeline (in order of severity):
 *   1. Root drive  (C:\, /, etc.)
 *   2. User home root
 *   3. Broad user-home subdirectory — walks the full ancestor chain so
 *      cloud-sync redirects (OneDrive\Desktop, Dropbox\Documents, …) are caught
 *   4. OS system directory
 */
export function isPathSafe(
  fsPath: string,
  options: PathValidationOptions = {},
  logger?: Logger,
): PathSafetyResult {
  const { allowUserHomeSubdirs = false } = options;
  log(`[path-safety] isPathSafe — "${fsPath}"`, "debug", logger);

  let normalized: string;
  try {
    normalized = normalizeAndValidatePath(fsPath, logger);
  } catch (err) {
    log(`[path-safety] validation error: ${err}`, "error", logger);
    return {
      isSafe: false,
      reason: "system_directory",
      suggestedAction: "Invalid or inaccessible path",
    };
  }

  if (isRootDrive(normalized)) {
    log(`[path-safety] UNSAFE root_drive: "${normalized}"`, "warn", logger);
    return {
      isSafe: false,
      reason: "root_drive",
      suggestedAction:
        "Select a specific project folder instead of the entire drive",
      estimatedFiles: 100_000,
    };
  }

  if (isUserHomeRoot(normalized)) {
    log(`[path-safety] UNSAFE user_home_top: "${normalized}"`, "warn", logger);
    return {
      isSafe: false,
      reason: "user_home_top",
      suggestedAction:
        "Select a specific project folder instead of your home directory",
      estimatedFiles: 50_000,
    };
  }

  if (isAncestorUnsafeSubdir(normalized)) {
    if (!allowUserHomeSubdirs) {
      log(
        `[path-safety] UNSAFE user_home_subdir: "${normalized}"`,
        "warn",
        logger,
      );
      return {
        isSafe: false,
        reason: "user_home_subdir",
        suggestedAction:
          "This directory may contain many unrelated files. Open a specific project folder instead.",
        estimatedFiles: 10_000,
      };
    }
    log(
      `[path-safety] user_home_subdir allowed by options: "${normalized}"`,
      "debug",
      logger,
    );
  }

  if (isSystemDirectory(normalized)) {
    log(
      `[path-safety] UNSAFE system_directory: "${normalized}"`,
      "warn",
      logger,
    );
    return {
      isSafe: false,
      reason: "system_directory",
      suggestedAction:
        "System directories cannot be scanned for security reasons",
    };
  }

  log(`[path-safety] SAFE: "${normalized}"`, "debug", logger);
  return { isSafe: true, reason: "safe" };
}

/**
 * Normalises a raw path and validates it against traversal/injection patterns.
 * Throws on empty input, null bytes, or any traversal sequence.
 */
export function normalizeAndValidatePath(
  fsPath: string,
  logger?: Logger,
): string {
  if (!fsPath || typeof fsPath !== "string") {
    throw new Error("Path must be a non-empty string");
  }

  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (fsPath.toLowerCase().includes(pattern.toLowerCase())) {
      log(
        `[path-safety] traversal pattern detected: "${pattern}"`,
        "warn",
        logger,
      );
      throw new Error(`Path contains unsafe sequence: ${pattern}`);
    }
  }

  const normalized = path.normalize(path.resolve(fsPath));
  log(
    `[path-safety] normalized: "${fsPath}" → "${normalized}"`,
    "debug",
    logger,
  );
  return normalized;
}

/**
 * Detects symlink loops during recursive directory traversal.
 * Pass the same `visitedRealPaths` Set across all recursive calls.
 * Returns true (treat as loop) if the symlink target cannot be resolved.
 */
export function isSymlinkLoop(
  targetPath: string,
  visitedRealPaths: Set<string>,
  logger?: Logger,
): boolean {
  log(`[path-safety] isSymlinkLoop — "${targetPath}"`, "debug", logger);
  try {
    const realPath = fs.realpathSync(targetPath);
    const isLoop = visitedRealPaths.has(realPath);
    log(`[path-safety] realPath="${realPath}" loop=${isLoop}`, "debug", logger);
    return isLoop;
  } catch (err) {
    log(
      `[path-safety] cannot resolve symlink "${targetPath}": ${err}`,
      "warn",
      logger,
    );
    return true;
  }
}
