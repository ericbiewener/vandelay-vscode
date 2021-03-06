import { findFileForExtensions } from '@ericbiewener/utils/src/findFileForExtensions'
import { window, TextEditor } from 'vscode'
import path from 'path'
import { PluginJs, MergedExportDataJs, RichQuickPickItemJs, ExportType } from '../types'
import { isIndexFile } from '../utils'

const CSS_EXTENSIONS = ['css', 'pcss']

export function buildImportItems(
  plugin: PluginJs,
  exportData: MergedExportDataJs,
  sortedKeys: string[]
): RichQuickPickItemJs[] {
  const { projectRoot, shouldIncludeImport, cssExtensions } = plugin
  const editor = window.activeTextEditor as TextEditor
  const activeFilepath = editor.document.fileName
  const items = []

  const cssModulePath = findFileForExtensions(activeFilepath, cssExtensions || CSS_EXTENSIONS)

  if (cssModulePath) {
    items.push({
      label: 'styles',
      description: path.relative(projectRoot, cssModulePath),
      exportType: ExportType.default,
      isExtraImport: false,
      absImportPath: cssModulePath,
    })
  }

  for (const importPath of sortedKeys) {
    let absImportPath = path.join(projectRoot, importPath)
    if (absImportPath === activeFilepath) continue
    if (shouldIncludeImport && !shouldIncludeImport(absImportPath, activeFilepath)) {
      continue
    }

    const data = exportData[importPath]
    let defaultExport
    let namedExports
    let typeExports

    // Filter out reexported names
    if (
      // If the current file has imports that were reexported
      data.reexported &&
      // Only import from index.js if active file not adjacent to nor in a subdirectory relative to
      // the import's reexport path. Can't simply test to make sure it's in a subdirectory relative
      // to the import's true path, because the import might be getting reexported multiple
      // directories higher up, in which case it should not be imported from that reexport location
      // if the active file is adjacent/in a subdirectory.
      !activeFilepath.startsWith(
        path.join(plugin.projectRoot, path.dirname(data.reexported.reexportPath))
      )
    ) {
      const { reexports } = data.reexported
      if (data.default && !reexports.includes('default')) defaultExport = data.default
      namedExports = data.named.filter((exp) => !reexports.includes(exp))
      typeExports = data.types.filter((exp) => !reexports.includes(exp))
    } else {
      defaultExport = data.default
      const { reexports } = data

      // If some of the names are reexports from other files (e.g. it's an index.js file) and the
      // active file is adjacent to or in a subdirectory of the import file, eliminate the reexports
      // because they'll just be imported from their original locations
      if (reexports && activeFilepath.startsWith(path.dirname(absImportPath))) {
        namedExports = data.named.filter((n) => !reexports.includes(n))
        typeExports = data.types.filter((n) => !reexports.includes(n))
      } else {
        namedExports = data.named
        typeExports = data.types
      }
    }

    const ext = path.extname(importPath)
    const importPathNoExt = ext && ext !== '.macro' ? importPath.slice(0, -ext.length) : importPath

    if (isIndexFile(absImportPath)) absImportPath = path.dirname(absImportPath)

    if (defaultExport) {
      items.push({
        label: processImportName(
          plugin,
          defaultExport,
          importPath,
          absImportPath,
          activeFilepath,
          true
        ),
        description: importPathNoExt,
        exportType: ExportType.default,
        isExtraImport: data.isExtraImport,
        absImportPath,
      })
    }

    if (namedExports) {
      namedExports.forEach((exportName) => {
        items.push({
          label: processImportName(
            plugin,
            exportName,
            importPath,
            absImportPath,
            activeFilepath,
            false
          ),
          description: importPathNoExt,
          exportType: ExportType.named,
          isExtraImport: data.isExtraImport,
          absImportPath,
        })
      })
    }

    if (typeExports) {
      typeExports.forEach((exportName) => {
        items.push({
          label: processImportName(
            plugin,
            exportName,
            importPath,
            absImportPath,
            activeFilepath,
            false
          ),
          description: importPathNoExt,
          exportType: ExportType.type,
          isExtraImport: data.isExtraImport,
          absImportPath,
        })
      })
    }
  }

  return items
}

function processImportName(
  plugin: PluginJs,
  importName: string,
  importPath: string,
  absImportPath: string,
  activeFilepath: string,
  isDefault: boolean
) {
  if (!plugin.processImportName) return importName
  return (
    plugin.processImportName(
      importName,
      importPath,
      absImportPath,
      activeFilepath,
      plugin.projectRoot,
      isDefault
    ) || importName
  )
}
