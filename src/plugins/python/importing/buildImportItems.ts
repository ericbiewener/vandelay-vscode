import path from "path";
import { window, TextEditor } from "vscode";
import { PluginPy, MergedExportDataPy } from "../types";
import { removeExt } from "../../../utils";
import { RichQuickPickItem } from "../../../types";

// FIXME: add quick start to readme -- just create vandelay-*.js in root, and includePaths, and done!

export function buildImportItems(
  plugin: PluginPy,
  exportData: MergedExportDataPy,
  sortedKeys: string[]
): RichQuickPickItem[] {
  const { projectRoot, shouldIncludeImport } = plugin;
  const editor = window.activeTextEditor as TextEditor;
  const activeFilepath = editor.document.fileName;
  const items = [];

  for (const importPath of sortedKeys) {
    const data = exportData[importPath];
    const absImportPath = data.isExtraImport
      ? importPath
      : path.join(projectRoot, importPath);
    if (absImportPath === activeFilepath) continue;
    if (
      shouldIncludeImport &&
      !shouldIncludeImport(absImportPath, activeFilepath)
    ) {
      continue;
    }

    let dotPath;
    if (data.isExtraImport) {
      dotPath = importPath;
    } else {
      dotPath = removeExt(importPath).replace(/\//g, ".");
      if (plugin.processImportPath) {
        dotPath = plugin.processImportPath(
          importPath,
          absImportPath,
          activeFilepath,
          plugin.projectRoot
        );
      }
    }

    if (data.importEntirePackage) {
      items.push({
        label: importPath,
        isExtraImport: data.isExtraImport
      });
    }

    if (!data.exports) continue;

    for (const exportName of data.exports) {
      items.push({
        label: exportName,
        description: dotPath,
        isExtraImport: data.isExtraImport
      });
    }
  }

  return items;
}
