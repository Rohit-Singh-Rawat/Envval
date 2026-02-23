import * as vscode from "vscode";
import path from "path";

interface QuickPickOption {
  label: string;
  description?: string;
  value: string;
}

/**
 * Shows a modal quick pick that requires user selection.
 * Returns the selected value or undefined if cancelled.
 */
async function showModalQuickPick<T extends string>(
  title: string,
  placeholder: string,
  options: QuickPickOption[],
): Promise<T | undefined> {
  const result = await vscode.window.showQuickPick(options, {
    title,
    placeHolder: placeholder,
    ignoreFocusOut: true,
  });
  return result?.value as T | undefined;
}

/**
 * Extracts the folder name from a workspace path for use as default repo name.
 */
export function extractFolderName(workspacePath: string): string {
  const folderName = path.basename(workspacePath);
  return folderName || "Unnamed Project";
}

export async function showInitPrompt(
  fileName: string,
): Promise<"initialize" | "cancel"> {
  const result = await showModalQuickPick<"initialize" | "cancel">(
    "Envval: New Environment File",
    `Initialize ${fileName} with Envval?`,
    [
      {
        label: "$(cloud-upload) Initialize",
        description: "Start syncing this file",
        value: "initialize",
      },
      { label: "$(x) Cancel", description: "Skip for now", value: "cancel" },
    ],
  );
  return result ?? "cancel";
}

export async function showRestorePrompt(
  fileName: string,
): Promise<"restore" | "cancel"> {
  const result = await showModalQuickPick<"restore" | "cancel">(
    "Envval: Remote File Found",
    `${fileName} exists remotely but not locally`,
    [
      {
        label: "$(cloud-download) Restore",
        description: "Download from Envval",
        value: "restore",
      },
      { label: "$(x) Cancel", description: "Skip", value: "cancel" },
    ],
  );
  return result ?? "cancel";
}

export async function showFirstTimeSyncPrompt(
  fileName: string,
): Promise<"useLocal" | "useRemote" | "cancel"> {
  const result = await showModalQuickPick<"useLocal" | "useRemote" | "cancel">(
    "Envval: Version Conflict",
    `Both local and remote versions of ${fileName} exist`,
    [
      {
        label: "$(file) Use Local",
        description: "Keep local version, overwrite remote",
        value: "useLocal",
      },
      {
        label: "$(cloud) Use Remote",
        description: "Download remote, overwrite local",
        value: "useRemote",
      },
      { label: "$(x) Cancel", description: "Decide later", value: "cancel" },
    ],
  );
  return result ?? "cancel";
}

export async function showZombiePrompt(
  fileName: string,
): Promise<"reinitialize" | "deleteLocal" | "skip"> {
  const result = await showModalQuickPick<
    "reinitialize" | "deleteLocal" | "skip"
  >(
    "Envval: Remote Environment Missing",
    `${fileName} was deleted from the server but still exists locally.`,
    [
      {
        label: "$(cloud-upload) Re-initialize",
        description: "Upload local version to server",
        value: "reinitialize",
      },
      {
        label: "$(trash) Delete Local",
        description: "Remove local file",
        value: "deleteLocal",
      },
      {
        label: "$(history) Skip",
        description: "Don't ask again for 24 hours",
        value: "skip",
      },
    ],
  );
  return result ?? "skip";
}

export async function showRepoRegistrationPrompt(): Promise<
  "register" | "skip"
> {
  const result = await showModalQuickPick<"register" | "skip">(
    "Envval: Repository Setup",
    "Register this repository for syncing?",
    [
      {
        label: "$(repo) Register",
        description: "Enable Envval for this repo",
        value: "register",
      },
      { label: "$(circle-slash) Skip", description: "Not now", value: "skip" },
    ],
  );
  return result ?? "skip";
}

export interface RepoNameResult {
  action: "custom" | "auto" | "skip";
  name?: string;
}

/**
 * Prompts user to choose how to name their repository.
 * Returns the chosen action and the name if custom was selected.
 */
export async function showRepoNamePrompt(
  workspacePath: string,
): Promise<RepoNameResult> {
  const defaultName = extractFolderName(workspacePath);

  const choice = await showModalQuickPick<"custom" | "auto" | "skip">(
    "Envval: Name Your Project",
    "Choose how to identify this project",
    [
      {
        label: `$(folder) Use "${defaultName}"`,
        description: "Auto-generate from folder name",
        value: "auto",
      },
      {
        label: "$(edit) Enter Custom Name",
        description: "Choose your own project name",
        value: "custom",
      },
      { label: "$(x) Skip", description: "Cancel registration", value: "skip" },
    ],
  );

  if (choice === "skip" || !choice) {
    return { action: "skip" };
  }

  if (choice === "auto") {
    return { action: "auto", name: defaultName };
  }

  const customName = await vscode.window.showInputBox({
    title: "Envval: Project Name",
    prompt: "Enter a name for this project",
    value: defaultName,
    validateInput: (value) => {
      if (!value?.trim()) {
        return "Name cannot be empty";
      }
      if (value.length > 100) {
        return "Name must be 100 characters or less";
      }
      return null;
    },
    ignoreFocusOut: true,
  });

  if (!customName) {
    return { action: "skip" };
  }

  return { action: "custom", name: customName.trim() };
}

export async function showEmptyFileConfirmation(
  fileName: string,
): Promise<"yes" | "no"> {
  const result = await showModalQuickPick<"yes" | "no">(
    "Envval: Empty File",
    `${fileName} is empty. Initialize anyway?`,
    [
      {
        label: "$(check) Yes",
        description: "Initialize empty file",
        value: "yes",
      },
      { label: "$(x) No", description: "Cancel", value: "no" },
    ],
  );
  return result ?? "no";
}

/** Show success notification with progress indicator */
export function showSuccess(message: string): void {
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Envval: ${message}`,
      cancellable: false,
    },
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    },
  );
}

/** Show error notification - stays until dismissed */
export function showError(message: string): void {
  vscode.window.showErrorMessage(`Envval: ${message}`, { modal: false });
}
