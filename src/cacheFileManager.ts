import fs from "fs";
import { isFile } from "./utils";
import { ExportData, Plugin, CachingData } from "./types";

function parseCacheFile(plugin: Plugin) {
  return isFile(plugin.cacheFilePath)
    ? JSON.parse(fs.readFileSync(plugin.cacheFilePath, "utf-8"))
    : {};
}

/**
 * Block access to the cache file until a previous accessor has finished its operations.
 * This prevents race conditions resulting in the last accessor overwriting prior ones' data.
 *
 * `cb` should return a promise (e.g. any file writing operations) so that it completes before the next call
 * to the cacheFileManager
 */
// FIXME: i don't think CachingData is right. It's a nonfinalized version of the data to be cached...
let fileAccess: Promise<void>;

export function cacheFileManager(
  plugin: Plugin,
  cb: (data: CachingData) => void
) {
  fileAccess = fileAccess
    ? fileAccess.then(() => cb(parseCacheFile(plugin)))
    : Promise.resolve(cb(parseCacheFile(plugin)));
  return fileAccess;
}
