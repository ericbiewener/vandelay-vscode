import { Plugin, PluginConfig, RichQuickPickItem, UserConfig } from '../../types'

// TODO: uppercase
export enum ExportType {
  default = 0,
  named = 1,
  type = 2,
}

export type RichQuickPickItemJs = RichQuickPickItem & {
  absImportPath: string
  exportType: ExportType
  description: string
}

/**
 * Cached Data Structurs
 */

export type FileExportsJs = {
  default?: string | null | undefined
  named: string[]
  types: string[]
}

export type NodeModuleExports = FileExportsJs & { isExtraImport: true }

export type ExportDatumJs = FileExportsJs & {
  cached?: number
  // TODO: rename `reexports` and `reexported` to make clearer
  // Exports in current file that are reexported elsewhere
  reexports?: string[]
  // Exports in other files that are reexported in current file
  reexported?: {
    reexportPath: string
    reexports: string[]
  }
}

export type ReexportsToProcess = {
  fullModules: string[]
  selective: { [path: string]: string[] }
}

export type NonFinalExportDatumJs = ExportDatumJs & {
  reexportsToProcess?: ReexportsToProcess
}

export type NonFinalExportDataJs = {
  [path: string]: NonFinalExportDatumJs
}

export type ExportDataExportsJs = {
  [path: string]: ExportDatumJs
}
export type MergedExportDataJs = {
  [path: string]: ExportDatumJs & { isExtraImport?: true }
}

export type ExportDataNodeModulesJs = {
  [path: string]: NodeModuleExports
}

export type ExportDataJs = {
  exp: {
    [path: string]: FileExportsJs
  }
  imp: ExportDataNodeModulesJs
  nodeModules: ExportDataNodeModulesJs
}

export type CachingDataJs = {
  exp: NonFinalExportDataJs
  imp: ExportDataNodeModulesJs
  nodeModules: ExportDataNodeModulesJs
}

/**
 * Plugin Config
 */

export type PluginConfigJs = PluginConfig<RichQuickPickItemJs> & {
  language: 'js'
  useSingleQuotes: boolean
  padCurlyBraces: boolean
  useSemicolons: boolean
  trailingComma: boolean
  multilineImportStyle: 'single' | 'multiple'
}

export type UserConfigJs = UserConfig & {
  useES5?: boolean
  preferTypeOutside?: boolean
  padCurlyBraces?: boolean
  useSingleQuotes?: boolean
  useSemicolons?: boolean
  multilineImportStyle?: 'single' | 'multiple'
  trailingComma?: boolean
  importGroups?: string[]
  typescript?: boolean
  cssExtensions?: string[]
  dependencies?: Record<string, string>
  processImportName?(
    importName: string,
    importPath: string,
    absImportPath: string,
    activeFilepath: string,
    projectRoot: string,
    isDefault: boolean
  ): string | undefined
}

export type PluginJs = Plugin<RichQuickPickItemJs> &
  PluginConfigJs &
  UserConfigJs & {
    processCachedData: NonNullable<Plugin<any>['processCachedData']>
  }
