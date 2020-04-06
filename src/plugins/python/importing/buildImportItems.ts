import path from 'path'
import { removeFileExt } from 'utlz'
import { window, TextEditor } from 'vscode'
import { PluginPy, MergedExportDataPy } from '../types'
import { RichQuickPickItem } from '../../../types'

export function buildImportItems(
  plugin: PluginPy,
  exportData: MergedExportDataPy,
  sortedKeys: string[],
): RichQuickPickItem[] {
  const { projectRoot, shouldIncludeImport } = plugin
  const editor = window.activeTextEditor as TextEditor
  const activeFilepath = editor.document.fileName
  const items = []

  for (const importPath of sortedKeys) {
    const data = exportData[importPath]
    const absImportPath = data.isExtraImport ? importPath : path.join(projectRoot, importPath)
    if (absImportPath === activeFilepath) continue
    if (shouldIncludeImport && !shouldIncludeImport(absImportPath, activeFilepath)) {
      continue
    }

    const dotPath = data.isExtraImport ? importPath : removeFileExt(importPath).replace(/\//g, '.')

    if (data.importEntirePackage) {
      items.push({
        label: processImportName(plugin, importPath, dotPath, absImportPath, activeFilepath),
        isExtraImport: data.isExtraImport,
        absImportPath,
      })
    }

    if (!data.exports) continue

    // Don't sort data.exports because they were already sorted when caching. See python `cacheFile`
    for (const exportName of data.exports) {
      items.push({
        label: processImportName(plugin, exportName, dotPath, absImportPath, activeFilepath),
        description: dotPath,
        isExtraImport: data.isExtraImport,
        absImportPath,
      })
    }
  }

  return items
}

function processImportName(
  plugin: PluginPy,
  importName: string,
  importPath: string,
  absImportPath: string,
  activeFilepath: string,
) {
  if (!plugin.processImportName) return importName
  return (
    plugin.processImportName(
      importName,
      importPath,
      absImportPath,
      activeFilepath,
      plugin.projectRoot,
    ) || importName
  )
}
