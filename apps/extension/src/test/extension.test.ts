import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension Test Suite", () => {
  test("Extension should be present", () => {
    assert.ok(vscode.extensions.getExtension("Envval-ext.Envval-ext"));
  });

  test("Extension should activate", async () => {
    const ext = vscode.extensions.getExtension("Envval-ext.Envval-ext");
    if (ext && !ext.isActive) {
      await ext.activate();
    }
    assert.ok(ext?.isActive);
  });
});
