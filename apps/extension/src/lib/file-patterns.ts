/**
 * File scanning patterns for environment file discovery.
 *
 * These patterns are used with VS Code's workspace.findFiles API to control
 * which directories are included or excluded from scanning.
 *
 * Following industry standards from popular extensions like ESLint, Prettier, and GitLens.
 */

/**
 * Glob pattern for matching environment files.
 * Matches .env, .env.local, .env.production, etc.
 */
export const ENV_FILE_INCLUDE_PATTERN = '**/.env*' as const;

/**
 * Directories to exclude from environment file scanning.
 *
 * These patterns prevent scanning of:
 * - Build outputs (dist, build, out, etc.)
 * - Package dependencies (node_modules, vendor, etc.)
 * - Version control directories (.git, .svn, .hg)
 * - IDE/Editor configuration (.vscode, .idea, etc.)
 * - Cache and temporary directories
 * - Virtual environments (Python, Ruby, etc.)
 *
 * Note: VS Code's findFiles automatically respects:
 * - .gitignore files (in workspace root)
 * - User's files.exclude settings
 * - User's search.exclude settings
 *
 * These explicit exclusions ensure consistent behavior even if .gitignore is missing.
 */
const EXCLUDE_PATTERNS = [
  // Package dependencies
  'node_modules',
  'vendor',
  'packages',
  'bower_components',

  // Build outputs
  'dist',
  'build',
  'out',
  'output',
  '.next',
  '.nuxt',
  'target',
  'bin',
  'obj',

  // Version control
  '.git',
  '.svn',
  '.hg',

  // IDE and editor
  '.vscode',
  '.idea',
  '.vs',
  '.vscode-test',

  // Cache and temporary
  '.cache',
  '.temp',
  '.tmp',
  'tmp',
  'temp',

  // Python
  '__pycache__',
  '.pytest_cache',
  '.mypy_cache',
  '.venv',
  'venv',
  'env',

  // Ruby
  '.bundle',

  // Rust
  'target',

  // Go
  'vendor',

  // Java/Kotlin
  'target',
  '.gradle',

  // PHP
  'vendor',

  // OS files (should be in .gitignore but adding for safety)
  '.DS_Store',
  'Thumbs.db',
] as const;

/**
 * Formatted exclude pattern string for VS Code's findFiles API.
 * Format: {pattern1,pattern2,...} with **\/ prefix for recursive matching.
 *
 * Example output: {**\/node_modules\/**,**\/.git\/**,...}
 */
export const ENV_FILE_EXCLUDE_PATTERN = `{${EXCLUDE_PATTERNS.map(pattern => `**/${pattern}/**`).join(',')}}` as const;

/**
 * Array of directory names to exclude (for custom filtering if needed).
 * Exported for use in manual directory traversal or custom filtering logic.
 */
export const EXCLUDE_DIRECTORY_NAMES = EXCLUDE_PATTERNS;

/**
 * Checks if a directory name should be excluded from scanning.
 * Useful for custom file system traversal or additional filtering.
 *
 * @param dirName - Directory name to check
 * @returns true if directory should be excluded
 */
export function shouldExcludeDirectory(dirName: string): boolean {
  return EXCLUDE_PATTERNS.includes(dirName as typeof EXCLUDE_PATTERNS[number]);
}

/**
 * Checks if a path contains any excluded directory.
 * Useful for filtering file paths after retrieval.
 *
 * @param filePath - File path to check (can be relative or absolute)
 * @returns true if path contains an excluded directory
 */
export function pathContainsExcludedDirectory(filePath: string): boolean {
  const pathParts = filePath.split(/[/\\]/);
  return pathParts.some(part => shouldExcludeDirectory(part));
}
