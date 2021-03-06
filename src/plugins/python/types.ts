import { Plugin, PluginConfig, RichQuickPickItem, UserConfig } from '../../types'

/**
 * Cached Data Structures
 */

export type FileExportsPy = {
  importEntirePackage?: boolean
  exports?: string[]
}

export type ExportDatumPy = FileExportsPy & {
  cached?: number
}

export type ReexportsToProcess = {
  fullModules: string[]
  selective: { [path: string]: string[] }
}

export type ExportDataImportsPy = {
  [path: string]: FileExportsPy
}
export type ExportDataExportsPy = {
  [path: string]: ExportDatumPy
}
export type MergedExportDataPy = {
  [path: string]: ExportDatumPy & { isExtraImport?: true }
}

export type ExportDataPy = {
  imp: ExportDataImportsPy
  exp: ExportDataExportsPy
}

export type CachingDataPy = {
  exp: ExportDataExportsPy
  imp: {
    [path: string]: FileExportsPy & { isExtraImport?: true }
  }
}

/**
 * Plugin Config
 */

export type PluginConfigPy = PluginConfig<RichQuickPickItem> & {
  language: 'py'
}

export type UserConfigPy = UserConfig & {
  importGroups?: string[][]
  processImportName?(
    importName: string,
    importPath: string,
    absImportPath: string,
    activeFilepath: string,
    projectRoot: string
  ): string | undefined
}

export type PluginPy = Plugin<RichQuickPickItem> & PluginConfigPy & UserConfigPy
