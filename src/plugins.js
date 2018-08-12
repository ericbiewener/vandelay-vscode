const { window, workspace } = require('vscode')
const path = require('path')
const { isFile, getFilepathKey } = require('./utils')
const sharedUtils = require('./sharedUtils')

const PLUGINS = {}

const defaultSettings = {
  maxImportLineLength: 100,
}

function initializePlugin(context, pluginConfig) {
  if (!workspace.workspaceFolders) return

  const config = workspace.getConfiguration('vandelay')
  const firstWorkspaceFolder = workspace.workspaceFolders[0].uri.path
  const configLocation = config.configLocation || firstWorkspaceFolder
  const projectRoot = config.projectRoot || firstWorkspaceFolder

  const { language } = pluginConfig
  const configFile = 'vandelay-' + language + '.js'
  const configSettings = getProjectSettings(configLocation, configFile)
  if (!configSettings) return

  const plugin = Object.assign(
    {},
    defaultSettings,
    pluginConfig,
    configSettings
  )
  PLUGINS[language] = plugin

  plugin.cacheDirPath = context.storagePath
  plugin.cacheFilePath = path.join(
    plugin.cacheDirPath,
    'vandelay-' + language + '.json'
  )
  plugin.projectRoot = projectRoot
  plugin.configFile = configFile

  plugin.excludePatterns = plugin.excludePatterns || []
  plugin.excludePatterns.push(/.*\/\.git(\/.*)?/)

  // Share some core utils with the plugin argument already provided
  plugin.utils = Object.assign(
    {
      plugin, // add reference on `utils` so that when a util method is called, the main plugin can be accessed via this.plugin
      getFilepathKey: filePath => getFilepathKey(plugin, filePath),
    },
    sharedUtils
  )

  if (plugin.finalizePlugin) plugin.finalizePlugin(plugin)

  if (!isFile(plugin.cacheFilePath)) {
    const { cacheProjectLanguage } = require('./cacher')
    cacheProjectLanguage(plugin)
  }
}

function getProjectSettings(vandelayDir, vandelayFile) {
  try {
    return require(path.join(vandelayDir, vandelayFile))
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      window.showErrorMessage(
        'Cound not parse your ' + vandelayFile + ' file. Error:\n\n' + e
      )
      throw e
    }
  }
}

module.exports = {
  PLUGINS,
  initializePlugin,
}
