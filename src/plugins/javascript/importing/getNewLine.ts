import { getTabChar } from '../../../utils'
import { FileExportsJs, PluginJs } from '../types'

export function getNewLine(plugin: PluginJs, importPath: string, lineImports: FileExportsJs) {
  const {
    padCurlyBraces,
    useSingleQuotes,
    useSemicolons,
    maxImportLineLength,
    multilineImportStyle,
    trailingComma,
  } = plugin

  const sensitivity = { sensitivity: 'base' }
  lineImports.named.sort((a, b) => a.localeCompare(b, undefined, sensitivity))
  lineImports.types.sort((a, b) => a.localeCompare(b, undefined, sensitivity))

  const putTypeOutside =
    plugin.preferTypeOutside && !lineImports.default && !lineImports.named.length
  const nonDefaultImports = putTypeOutside
    ? lineImports.types
    : lineImports.named.concat(lineImports.types.map((t) => 'type ' + t))

  let newLineStart = plugin.useES5 ? 'const' : 'import'
  if (lineImports.default) newLineStart += ' ' + lineImports.default

  let newLineMiddle = ''
  let newLineEnd = ''
  if (nonDefaultImports.length) {
    if (lineImports.default) newLineStart += ','
    if (putTypeOutside) newLineStart += ' type'
    newLineStart += ' {'
    if (padCurlyBraces) newLineStart += ' '
    newLineMiddle = nonDefaultImports.join(', ')
    if (padCurlyBraces) newLineEnd += ' '
    newLineEnd += '}'
  }

  // Replace \ with / for Windows
  const normalizedImportPath = importPath.replace(/\\/g, '/')

  const quoteChar = useSingleQuotes ? "'" : '"'
  newLineEnd += ` ${
    plugin.useES5 ? '= require(' : 'from '
  }${quoteChar}${normalizedImportPath}${quoteChar}${plugin.useES5 ? ')' : ''}`
  if (useSemicolons) newLineEnd += ';'

  // Split up line if necessary

  const tabChar = getTabChar()
  const newLineLength = newLineStart.length + newLineMiddle.length + newLineEnd.length

  // If line is short enough OR there are no named/type imports, no need to split into multiline
  if (newLineLength <= maxImportLineLength || !nonDefaultImports.length) {
    return newLineStart + newLineMiddle + newLineEnd
  }

  if (multilineImportStyle === 'single') {
    // trim start & end to remove possible curly brace padding
    const final =
      newLineStart.trim() +
      '\n' +
      tabChar +
      nonDefaultImports.join(',\n' + tabChar) +
      (trailingComma ? ',' : '') +
      '\n' +
      newLineEnd.trim()

    return final
  }

  let line = newLineStart
  let fullText = ''

  nonDefaultImports.forEach((name, i) => {
    const isLast = i === nonDefaultImports.length - 1

    let newText = (i > 0 ? ' ' : '') + name
    if (!isLast) newText += ','

    if (line.length + newText.length <= maxImportLineLength) {
      line += newText
    } else {
      fullText += line + '\n'
      line = tabChar + newText.trim()
    }
  })

  if (line.length + newLineEnd.length > maxImportLineLength) {
    line += '\n'
    newLineEnd = newLineEnd.trim()
  }

  return fullText + line + newLineEnd
}
