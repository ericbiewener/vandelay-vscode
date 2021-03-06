import { isFile } from '@ericbiewener/utils/src/isFile'
import { ExtensionContext, window, workspace } from 'vscode'
import path from 'path'
import { registerCompletionItemProvider } from './createCompletionItemProvider'
import { alertNewVersionConfig } from './newVersionAlerting'
import { pluginConfigs } from './registerPluginConfig'
import { findVandelayConfigDir, getConfiguration, isObject } from './utils'
import { Language, Plugin, PluginConfig, RuntimePluginConfig, UserConfig } from './types'
import { cacheProjectLanguage } from './cacher'

// & { [key: string]: undefined } is just to quiet unneeded TS errors
export const PLUGINS: { [key in Language]?: Plugin } & Record<string, undefined> = {}

const HIDDEN_FOLDERS_REGEX = /.*\/\..*/

export async function initializePlugin(context: ExtensionContext, pluginConfig: PluginConfig) {
  const { workspaceFolders } = workspace
  if (!workspaceFolders) return

  const cacheDirPath = context.storagePath
  if (!cacheDirPath) return

  const configWorkspaceFolder = findVandelayConfigDir(workspaceFolders)
  const configPath = (configWorkspaceFolder || workspaceFolders[0]).uri.fsPath

  const { language } = pluginConfig
  const configFile = 'vandelay-' + language + '.js'
  const configFilepath = path.join(configPath, configFile)
  const userConfig = await getUserConfig(configFilepath)
  if (!userConfig) return

  const runtimeConfig: RuntimePluginConfig = {
    configFile,
    configFilepath,
    cacheDirPath,
    cacheFilepath: path.join(cacheDirPath, 'vandelay-v2-' + language + '.json'),
    projectRoot: userConfig.projectRoot || workspaceFolders[0].uri.fsPath,
  }

  const plugin = Object.assign(
    { maxImportLineLength: 100 },
    pluginConfig,
    userConfig,
    runtimeConfig
  ) as Plugin
  plugin.excludePatterns.push(HIDDEN_FOLDERS_REGEX)

  PLUGINS[language] = plugin

  if (getConfiguration().provideCompletions) {
    registerCompletionItemProvider(context, plugin)
  }

  alertNewVersionConfig(plugin)

  console.info(`Vandelay language registered: ${language}`)

  const isInitialCache = isFile(plugin.cacheFilepath)
  await cacheProjectLanguage(plugin)
  // Don't await this, its completion isn't necessary for the extension to continue initializing
  if (plugin.finalizeInit) plugin.finalizeInit(context, plugin)
  return isInitialCache
}

async function getUserConfig(configFilepath: string) {
  try {
    console.log(`Loading vandelay config file from ${configFilepath}`)
    // @ts-ignore
    delete __non_webpack_require__.cache[configFilepath]
    // @ts-ignore
    const userConfig = __non_webpack_require__(configFilepath)

    if (!isObject(userConfig)) {
      window.showErrorMessage('Your Vandelay configuration file must export an object.')
      return
    }

    if (!userConfig.includePaths || !userConfig.includePaths.length) {
      window.showErrorMessage(
        `You must specify the "includePaths" configuration option in your ${path.basename(
          configFilepath
        )} file.`
      )
    }
    return userConfig as UserConfig
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') return // All good. Vandelay simply won't be used for the given language
    window.showErrorMessage(
      `Cound not parse your ${path.basename(configFilepath)} file. Error:\n\n${e}`
    )
    console.error(e)
  }
}

export async function initializePluginForLang(context: ExtensionContext, lang: string) {
  const config = pluginConfigs[lang]
  if (config) return initializePlugin(context, config)
}
