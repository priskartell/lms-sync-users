const azure = require('azure')
const config = require('../server/init/configuration')
const log = require('../server/init/logging')
const Promise = require('bluebird')

let blobService
module.exports = {
  get blobService () {
    log.info('getting blobService')
    if (!blobService) {
      log.info('Initializing blobService')
      blobService = Promise.promisifyAll(azure.createBlobService(config.secure.azure.StorageConnectionString))
    }

    return blobService
  }
}
