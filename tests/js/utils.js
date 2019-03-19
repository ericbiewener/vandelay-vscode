const _ = require('lodash')
const path = require('path')
const fs = require('fs-extra')
const expect = require('expect')
const { buildImportItems, insertImport } = require('../src/importing/importer')
const {
  commands,
  workspace,
  extensions,
  window,
  Uri,
  Range,
} = require('vscode')

const getPlugin = async () => {
  const api = await extensions.getExtension('edb.vandelay').activate()
  const plugins = api._test.plugins
  // since we're only testing one language activated at a time, just return the plugin associated
  // with the first key
  for (const lang in plugins) return plugin[lang]
}

const getExportData = plugin =>
  JSON.parse(fs.readFileSync(plugin.cacheFilePath, 'utf-8'))

const openFile = (...fileParts) =>
  window.showTextDocument(
    Uri.file(
      fileParts.length
        ? path.join(...fileParts)
        : path.join(TEST_ROOT, 'src1/file1.js')
    )
  )

const replaceFileContents = (newText = '') => {
  const editor = window.activeTextEditor
  return editor.edit(builder => {
    builder.replace(
      editor.document.validateRange(new Range(0, 0, 9999999999, 0)),
      newText
    )
  })
}

const getImportItems = plugin =>
  plugin._test.getImportItems(plugin, getExportData(plugin), buildImportItems)

const insertItems = async (plugin, importItems) => {
  for (const item of importItems || getImportItems(plugin)) {
    await insertImport(plugin, item)
  }
  return window.activeTextEditor.document.getText()
}

const insertTest = async (context, startingText, filepath) => {
  context.timeout(6000 * 5)
  const open = () => (filepath ? openFile(filepath) : openFile())

  const [plugin] = await Promise.all([getPlugin(), open()])
  await replaceFileContents(startingText)
  const originalItems = getImportItems(plugin)

  const originalResult = await insertItems(plugin, originalItems)
  expect(originalResult).toMatchSnapshot(context, 'original order')

  if (process.env.FULL_INSERT_TEST) {
    for (let i = 0; i < 8; i++) {
      await replaceFileContents(startingText)
      const newArray = _.shuffle(originalItems)
      const newResult = await insertItems(plugin, newArray)
      if (newResult !== originalResult) {
        console.log(`\n\n${JSON.stringify(newArray)}\n\n`)
      }
      expect(newResult).toBe(originalResult)
    }
  }
}

const configInsertTest = async (context, config, reCache) => {
  context.timeout(6000 * 5)
  if (reCache) await commands.executeCommand('vandelay.cacheProject')
  const [plugin] = await Promise.all([getPlugin(), openFile()])
  await replaceFileContents()
  Object.assign(plugin, config)
  const result = await insertItems(plugin)
  expect(result).toMatchSnapshot(context)
}

const cacheTest = async (context, config) => {
  const [plugin] = await Promise.all([getPlugin(), openFile()])
  Object.assign(plugin, config)
  await commands.executeCommand('vandelay.cacheProject')
  const data = JSON.parse(fs.readFileSync(plugin.cacheFilePath, 'utf-8'))
  expect(data).toMatchSnapshot(context)
}

const testSpyCall = (context, call) =>
  expect(call.args.map(p => p.replace(TEST_ROOT, 'absRoot'))).toMatchSnapshot(
    context
  )

module.exports = {
  TEST_ROOT,
  getPlugin,
  getExportData,
  openFile,
  replaceFileContents,
  insertTest,
  getImportItems,
  insertItems,
  configInsertTest,
  cacheTest,
  testSpyCall,
}
