import _ from 'lodash'
import { Diagnostic, Range, TextDocument, TextEditor, window } from 'vscode'
import { getConfiguration, getDiagnosticsForActiveEditor, getWordAtPosition } from './utils'
import { getPluginForActiveFile } from './utils'
import { cacheFileManager } from './cacheFileManager'
import { ExportData, MergedExportData, Plugin, RichQuickPickItem } from './types'

export const getItemsForText = (plugin: Plugin, exportData: ExportData, text?: string | null) => {
  const mergedData = plugin.mergeExportData(exportData)
  const sortedKeys = getExportDataKeysByCachedDate(mergedData)

  const items = plugin.buildImportItems(plugin as Plugin, mergedData, sortedKeys)
  if (!items) return

  return text ? items.filter((item: RichQuickPickItem) => item.label === text) : items
}

export async function selectImport(text?: string | null) {
  const plugin = getPluginForActiveFile()
  if (!plugin) return

  return await cacheFileManager(plugin, async (exportData) => {
    if (!exportData) return

    const items = getItemsForText(plugin, exportData, text)
    if (!items) return

    const item =
      !text || items.length > 1 || !getConfiguration().autoImportSingleResult
        ? await window.showQuickPick(items, { matchOnDescription: true })
        : items[0]

    if (!item) return
    await plugin.insertImport(plugin, item)
  })
}

export async function selectImportForActiveWord() {
  const editor = window.activeTextEditor
  if (!editor) return
  selectImport(getWordAtPosition(editor.document, editor.selection.active))
}

export async function importUndefinedVariables() {
  const plugin = getPluginForActiveFile()
  if (!plugin) return

  const diagnostics = getDiagnosticsForActiveEditor(plugin.shouldIncludeDisgnostic)
  if (!diagnostics.length) return

  const { document } = window.activeTextEditor as TextEditor
  const words = getUndefinedWords(document, diagnostics)
  for (const word of words) await selectImport(word)
}

function getExportDataKeysByCachedDate(exportData: MergedExportData) {
  return Object.keys(exportData).sort((a, b) => {
    const createdA = exportData[a].cached
    const createdB = exportData[b].cached
    if (!createdA && !createdB) return a < b ? -1 : 1 // alphabetical
    if (createdA && !createdB) return -1
    if (createdB && !createdA) return 1
    if (createdA === createdB) return 0
    // @ts-ignore
    return createdA < createdB ? 1 : -1
  })
}

export function getUndefinedWords(
  document: TextDocument,
  diagnostics: Diagnostic[],
  ignoreRanges: Range[] = []
) {
  // Must collect all words before inserting any because insertions will cause the diagnostic ranges
  // to no longer be correct, thus not allowing us to get subsequent words
  const words = diagnostics
    .map((d) => {
      // Flake8 is returning a collapsed range, so expand it to the entire word
      const range = _.isEqual(d.range.start, d.range.end)
        ? document.getWordRangeAtPosition(d.range.start)
        : d.range

      if (!range) return null

      // Don't import word if range overlaps at all
      for (const ignoreRange of ignoreRanges) {
        if (ignoreRange.intersection(range)) return null
      }

      return document.getText(range)
    })
    .filter(Boolean)

  return _.uniq(words)
}
