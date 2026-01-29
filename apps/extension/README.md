# EnvVal Extension

**EnvVal** is a VSCode extension for managing environment variables across different projects and repositories. It provides seamless synchronization of environment files with cloud storage and supports complex repository structures including monorepos, Git submodules, and worktrees.

## Features

### 🔍 Intelligent Repository Detection

EnvVal uses a sophisticated multi-layered system to identify repositories:

- **Automatic Detection**: Detects Git remotes, monorepo structures, and project signatures
- **Persistent Identity**: Maintains stable repository identities across sessions and devices
- **Migration Support**: Handles repository lifecycle changes (local → Git, remote URL changes)
- **Monorepo Support**: Distinguishes sub-projects within monorepos
- **Edge Case Handling**: Supports Git submodules, worktrees, and multiple remotes

### 🏗️ Repository Identity Priority Chain

1. **Manual Override** - User-specified custom identity (highest priority)
2. **Git Remote** - Normalized Git remote URL with support for multiple remotes
3. **Stored History** - Previously detected Git remotes
4. **Content Signature** - Package.json and file structure hash (fallback)

### 🔧 Repository Management Commands

- `EnvVal: View Repository Identity` - Display current repo information
- `EnvVal: Set Manual Repository Identity` - Override automatic detection
- `EnvVal: Set Sub-Project Path` - Configure monorepo sub-projects
- `EnvVal: Reset Repository Identity` - Return to automatic detection
- `EnvVal: Migrate Repository Identity` - Handle identity changes
- `EnvVal: Diagnose Repository Detection` - Comprehensive diagnostic report

### 📁 Environment File Management

- Automatic detection of `.env` files
- Support for multiple environment variants (`.env.local`, `.env.production`, etc.)
- Git-aware file tracking with `.gitignore` respect
- Cloud synchronization with metadata preservation

## Repository Detection Guide

### How Repository Identity Works

EnvVal automatically determines a unique identifier for each workspace using this priority system:

#### Priority 1: Manual Override
When you manually set a repository identity using `EnvVal: Set Manual Repository Identity`, it takes precedence over all automatic detection.

#### Priority 2: Git Remote
For Git repositories, EnvVal normalizes the remote URL to create a stable identifier:
- Converts SSH format (`git@github.com:user/repo.git`) to HTTPS
- Removes `.git` suffix and `www.` prefix
- Handles multiple remotes with configurable priority

#### Priority 3: Stored Git History
If a workspace previously had a Git remote, EnvVal remembers it for cross-session consistency.

#### Priority 4: Content Signature
Fallback method using project structure hash for non-Git projects.

### Monorepo Support

EnvVal automatically detects monorepo structures by looking for:
- `lerna.json`
- `nx.json`
- `pnpm-workspace.yaml`
- `workspaces` field in `package.json`
- Multiple `package.json` files in subdirectories

For monorepos, you can specify a sub-project path to distinguish between different projects within the same repository.

### Edge Cases Handled

- **Git Submodules**: Uses parent repository's remote URL
- **Git Worktrees**: Shares identity with main repository
- **Multiple Remotes**: Configurable preference (origin → upstream → any)
- **Cross-device Sync**: Persistent storage via VSCode settings sync

## Extension Settings

EnvVal contributes the following configuration options:

### Repository Detection Settings

* `envval.autoDetectMonorepo` *(boolean, default: true)*: Automatically detect monorepo structure and prompt for sub-project selection

* `envval.preferredRemote` *(string, default: "origin")*: Preferred Git remote to use for repo identification
  - `"origin"`: Use 'origin' remote
  - `"upstream"`: Use 'upstream' remote
  - `"any"`: Use any available remote

* `envval.promptForMigration` *(boolean, default: true)*: Prompt when repo identity migration is detected

### Example Configuration

```json
{
  "envval.autoDetectMonorepo": true,
  "envval.preferredRemote": "origin",
  "envval.promptForMigration": true
}
```

## Troubleshooting

### Repository Identity Issues

**Problem**: Repository identity changed unexpectedly
**Solution**: Use `EnvVal: View Repository Identity` to see current detection details

**Problem**: Wrong identity for monorepo sub-project
**Solution**: Use `EnvVal: Set Sub-Project Path` to specify the correct path

**Problem**: Need custom repository identity
**Solution**: Use `EnvVal: Set Manual Repository Identity` to override automatic detection

**Problem**: Identity not persisting across devices
**Solution**: Ensure VSCode Settings Sync is enabled and `envval` settings are included

### Diagnostic Tools

Run `EnvVal: Diagnose Repository Detection` to get a comprehensive report including:
- Current identity detection details
- Stored identity data and history
- Git remote analysis
- Monorepo structure detection
- Configuration settings
- Environment metadata counts

### Common Scenarios

#### Local Project Gets Git Remote
When you add a Git remote to a local project:
1. EnvVal detects the new remote
2. Prompts for migration (if enabled)
3. Updates all environment metadata to use Git-based identity
4. Stores migration history

#### Repository Remote URL Changes
When a repository's remote URL changes:
1. EnvVal detects the new URL
2. Calculates new repository identity
3. Offers migration to prevent data loss

#### Monorepo Sub-Project Setup
For monorepos with multiple projects:
1. Enable `autoDetectMonorepo` (default: true)
2. Use `Set Sub-Project Path` when prompted or manually
3. Each sub-project gets a unique identity: `repoId:subProjectPath`

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
