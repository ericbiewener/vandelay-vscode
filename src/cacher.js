const {window, workspace} = require('vscode')
const path = require('path')
const fs = require('fs-extra')
const _ = require('lodash')
const anymatch = require('anymatch')
const {writeCacheFile, parseCacheFile, getLangFromFilePath, getFilepathKey} = require('./utils')
const {PLUGINS} = require('./plugins')

function shouldIgnore(plugin, filePath) {
  return anymatch(plugin.excludePatterns, filePath)
}

function cacheDir(plugin, dir, recursive=true, data) {
  if (!data) data = { _extraImports: plugin.importsAreArrays ? [] : {} }
  return fs.readdir(dir).then(items => {
    const readDirPromises = []

    for (const item of items) {
      const fullPath = path.join(dir, item)
      if (shouldIgnore(plugin, fullPath)) continue

      readDirPromises.push(
        fs.lstat(fullPath).then(stats => {
          if (stats.isFile()) {
            if (item === plugin.configFile) return
            if (plugin.language !== getLangFromFilePath(item)) return
            plugin.cacheFile(plugin, fullPath, data)
          }
          else if (recursive) {
            return cacheDir(plugin, fullPath, true, data)
          }
        })
      )
    }

    return Promise.all(readDirPromises)
  })
    .then(() => data)
}

function cacheProjectLanguage(plugin) {
  let cacher = Promise.all(plugin.includePaths.map(p => cacheDir(plugin, p)))
    .then(exportObjArrays => (
      exportObjArrays.reduce((acc, obj) => Object.assign(acc, obj), {})
    ))

  if (plugin.processCachedData) cacher = cacher.then(plugin.processCachedData)
  return cacher.then(data => writeCacheFile(plugin, data))
}

function cacheProject() {
  return Promise.all(_.map(PLUGINS, cacheProjectLanguage))
    .then(() => window.showInformationMessage('Project exports have been cached.'))
}

function onChangeOrCreate(doc) {
  const plugin = PLUGINS[getLangFromFilePath(doc.path)]
  if (!plugin || shouldIgnore(plugin, doc.path)) return
  
  const data = plugin.cacheFile(plugin, doc.path)
  if (_.isEmpty(data)) return

  const cachedData = parseCacheFile(plugin)
  
  if (plugin.importsAreArrays) {
    data._extraImports = _.union(data._extraImports, cachedData._extraImports)
  } else {
    // Concatenate & dedupe named/types arrays. Merge them into data._extraImports since that will in turn get
    // merged back into cachedData
    _.mergeWith(data._extraImports, cachedData._extraImports, (a, b) => {
      if (_.isArray(a)) return _.union(a, b)
    })
  }

  writeCacheFile(plugin, Object.assign(cachedData, data))
}

function watchForChanges() {
  // TODO: kill on deactivate?
  const watcher = workspace.createFileSystemWatcher('**/*.*')

  watcher.onDidChange(onChangeOrCreate)
  watcher.onDidCreate(onChangeOrCreate)
  
  watcher.onDidDelete(doc => {
    const plugin = PLUGINS[getLangFromFilePath(doc.path)]
    const data = parseCacheFile(plugin)
    const key = getFilepathKey(plugin, doc.path)
    if (!data[key]) return
    delete data[key]
    writeCacheFile(plugin, data)
  })
}

module.exports = {
  cacheProject,
  cacheProjectLanguage,
  watchForChanges,
  getFilepathKey,
  _test: {
    cacheDir,
  }
}
