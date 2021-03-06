import fs from 'fs'
import { isFile } from '@ericbiewener/utils/src/isFile'
import { ExportData, Plugin } from './types'

function parseCacheFile(plugin: Plugin) {
  return isFile(plugin.cacheFilepath)
    ? JSON.parse(fs.readFileSync(plugin.cacheFilepath, 'utf8'))
    : {}
}

/**
 * Block access to the cache file until a previous accessor has finished its operations. This
 * prevents race conditions resulting in the last accessor overwriting prior ones' data.
 *
 * `cb` should return a promise (e.g. any file writing operations) so that it completes before the
 * next call to the cacheFileManager
 */
let fileAccess: Promise<any>

export function cacheFileManager(plugin: Plugin, cb: (data: ExportData) => any) {
  fileAccess = fileAccess
    ? fileAccess.then(() => cb(parseCacheFile(plugin)))
    : Promise.resolve(cb(parseCacheFile(plugin)))
  return fileAccess
}
