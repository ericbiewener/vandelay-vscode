import { registerPluginConfig } from '../../registerPluginConfig'
import { cacheFile } from './cacher'
import { insertImport } from './importing/importer'
import { buildImportItems } from './importing/buildImportItems'
import { removeUnusedImports } from './removeUnusedImports'
import { PluginConfigPy } from './types'
import { Diagnostic } from 'vscode'

function shouldIncludeDisgnostic({ code }: Diagnostic) {
  return code === 'F821'
}

const config: PluginConfigPy = {
  language: 'py',
  cacheFile,
  buildImportItems,
  insertImport,
  removeUnusedImports,
  shouldIncludeDisgnostic,
}

registerPluginConfig(config)
