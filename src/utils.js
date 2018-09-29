const fs = require('fs')
const makeDir = require('make-dir')
const path = require('path')
const _ = require('lodash')
const { window } = require('vscode')

function writeCacheFile(plugin, data) {
  _.each(data._extraImports, d => (d.isExtraImport = true))
  return makeDir(plugin.cacheDirPath).then(() =>
    fs.writeFileSync(plugin.cacheFilePath, JSON.stringify(data))
  )
}

function isFile(file) {
  try {
    return fs.statSync(file).isFile()
  } catch (e) {
    if (e.code !== 'ENOENT') throw e // File might exist, but something else went wrong (e.g. permissions error)
    return false
  }
}

function getLangFromFilePath(filePath) {
  const ext = path.extname(filePath).slice(1)
  return ext === 'jsx' ? 'js' : ext
}

function getPluginForActiveFile() {
  const { PLUGINS } = require('./plugins')
  return PLUGINS[getLangFromFilePath(window.activeTextEditor.document.fileName)]
}

function getFilepathKey(plugin, filepath) {
  return filepath.slice(plugin.projectRoot.length + 1)
}

// Extracted for sharing with plugins for testing
function getImportItems(plugin, exportData, buildImportItems) {
  Object.assign(exportData, exportData._extraImports)
  delete exportData._extraImports
  if (exportData)
    return (buildImportItems || plugin.buildImportItems)(plugin, exportData)
}

module.exports = {
  writeCacheFile,
  isFile,
  getLangFromFilePath,
  getPluginForActiveFile,
  getFilepathKey,
  getImportItems,
}
