### Version 4.5.0
- Added `dependencies` configuration option.

### Version 4.4.0
- Added `Fix All Import Paths` command for Typescript files.

### Version 4.3.0
- Provide CSS Module import options. See `cssExtensions` in the readme.

### Version 4.2.1
- Preserve `.macro` file extension when writing import paths ([#26](https://github.com/ericbiewener/vscode-vandelay/issues/26)).

### Version 4.2.0
- Run node_module import paths through `processImportPath`.

### Version 4.1.3
- Fixed bug when caching JavaScript re-exports

### Version 4.1.0
- Added configuration option for turning autocomplete suggestions on/off.

### Version 4.0.1
- Fix bug that prevented Python support from activating if no `excludePatterns` were provided.

### Version 4.0.0
- Import suggestions will now appear as you type!
- `package.json` parsing for Improved caching of node modules.
- More fixes to command `Remove Unused Imports`.
- Better removal of unused imports and importing of undefined variables in Typescript.

**Breaking Changes**
- Removed command `Import and Insert at Cursor`. It was just a lazy alternative to providing suggestions as you type.

### Version 3.1.1
- Parse *.tsx automatically as Typescript.

### Version 3.1.0
- New command `Import and Insert at Cursor`.

### Version 3.0.2
- Fixed command `Remove Unused Imports`.

### Version 3.0.1
- Fixed Python plugin. Whoops.

### Version 3.0.0
- New command `Initialize Project` to get started with Vandelay more easily.
- Improved import renaming (`import numpy as np`, `import { foo as bar }`)
- New configuration option `processImportName`.

**Breaking Changes**
- JavaScript configuration option `processDefaultName` has been removed. Use the new `processImportName` option.

### Version 2.4.0
- Normalize import paths for Windows (write / to file rather than \)

### Version 2.3.0
- Support *.mdx file extensions

### Version 2.2.0
- Preserve relative Python import paths
- Fix bug in `Fix Imports` command that could cause active file's unused imports to not get removed

### Version 2.1.0
- Typescript support

### Version 2.0
- Made JavaScript & Python plugins part of core Vandelay extension, so no longer any need to install
  those plugins separately. If you previously installed Vandelay JS or Vandelay PY, you may
  uninstall them.

### Version 1.3.1
- Fix for windows
- Downgrade event-stream because of security vulnerability

### 1.3.0
- Add Fix Imports command

### 1.2.3
- Dispose the disposables

### 1.2.2
- Suppress alert

### 1.2.1
- More flexible diagnostic filtering API

### 1.2.0
- Focus back to original editor after removing unused imports

### 1.1.0
- New feature: "Import Undefined Variables" command
- New feature: "Remove Unused Imports" command
- Add extension update notification
- Support *.mjs file extension
