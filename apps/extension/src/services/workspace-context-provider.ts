import * as vscode from "vscode";
import * as path from "path";

export interface WorkspaceContext {
  mode: "single-file" | "single-root" | "multi-root" | "none";
  primaryPath: string | undefined;
  allPaths: string[];
  isSingleFile: boolean;
  activeDocument?: vscode.TextDocument;
}

/**
 * Provides workspace context handling for different modes:
 * - single-file: User opened just a .env file without a workspace
 * - single-root: Standard single folder workspace
 * - multi-root: Multi-root workspace with multiple folders
 * - none: No workspace and no file open
 *
 * Follows patterns from Prettier and ESLint extensions for single-file support.
 */
export class WorkspaceContextProvider {
  private static instance: WorkspaceContextProvider;

  private constructor() {}

  public static getInstance(): WorkspaceContextProvider {
    if (!WorkspaceContextProvider.instance) {
      WorkspaceContextProvider.instance = new WorkspaceContextProvider();
    }
    return WorkspaceContextProvider.instance;
  }

  /**
   * Gets the current workspace context, detecting the mode and available paths.
   */
  public getWorkspaceContext(): WorkspaceContext {
    const folders = vscode.workspace.workspaceFolders;
    const activeDoc = vscode.window.activeTextEditor?.document;

    // Case 1: No workspace folders (single file mode or no workspace)
    if (!folders || folders.length === 0) {
      if (activeDoc && this.isEnvFile(activeDoc.fileName)) {
        // Single .env file open - use parent directory as workspace
        const parentDir = path.dirname(activeDoc.uri.fsPath);
        return {
          mode: "single-file",
          primaryPath: parentDir,
          allPaths: [parentDir],
          isSingleFile: true,
          activeDocument: activeDoc,
        };
      }

      // No workspace and no env file
      return {
        mode: "none",
        primaryPath: undefined,
        allPaths: [],
        isSingleFile: false,
      };
    }

    // Case 2: Single root workspace
    if (folders.length === 1) {
      return {
        mode: "single-root",
        primaryPath: folders[0].uri.fsPath,
        allPaths: [folders[0].uri.fsPath],
        isSingleFile: false,
      };
    }

    // Case 3: Multi-root workspace
    return {
      mode: "multi-root",
      primaryPath: folders[0].uri.fsPath,
      allPaths: folders.map((f) => f.uri.fsPath),
      isSingleFile: false,
    };
  }

  /**
   * Checks if a filename is an environment file.
   */
  private isEnvFile(fileName: string): boolean {
    const baseName = path.basename(fileName);
    return baseName === ".env" || baseName.startsWith(".env.");
  }
}
