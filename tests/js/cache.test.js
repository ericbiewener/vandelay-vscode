const _ = require('lodash')
const path = require('path')
const { cacheTests } = require('../shared-tests')
const { getPlugin, openFile, testSpyCall, cacheTest } = require('../utils')

describe("Cache Tests", function() {

  cacheTests()

  it('cacheProject - includePaths = [src2]', async function() {
    await cacheTest(this, {
      includePaths: [path.join(TEST_ROOT, 'src2')],
    })
  })

  it('cacheProject - excludePatterns = [src2]', async function() {
    await cacheTest(this, {
      excludePatterns: ['**/src2/*'],
    })
  })

  it('cacheProject - processDefaultName', async function() {
    const processDefaultName = sinon.fake(
      filepath => (filepath.endsWith('.js') ? 'DEFAULT' : null)
    )
    await cacheTest(this, { processDefaultName })
    testSpyCall(this, _.last(processDefaultName.getCalls()))
  })

  it('import - nonModulePaths', async function() {
    await cacheTest(this, { nonModulePaths: ['module1', 'module2'] })
  })

})