/**
 * File scanning patterns for environment file discovery.
 * Used with VS Code's workspace.findFiles API.
 */

/**
 * Broad include for VS Code glob engine compatibility.
 * Strict validity is enforced afterwards by `isValidEnvFilePath`.
 */
export const ENV_FILE_INCLUDE_PATTERN = '**/.env*' as const;

/**
 * Dot-prefixed directories (.*) are blanket-excluded because they are
 * universally tooling, build, or config folders — never user source code.
 * The remaining entries cover non-dot directories that also never contain
 * real .env files.
 */
const EXCLUDE_DIRS = [
  '.*',
  'node_modules',
  'vendor',
  'bower_components',
  'dist',
  'build',
  'out',
  'output',
  'target',
  'bin',
  'obj',
  'tmp',
  'temp',
  '__pycache__',
  'venv',
] as const;

/** Formatted exclude glob for VS Code's findFiles API. */
export const ENV_FILE_EXCLUDE_PATTERN = `{${EXCLUDE_DIRS.map(d => `**/${d}/**`).join(',')}}` as const;
