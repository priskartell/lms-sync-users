const azure = require('azure')
const config = require('../server/init/configuration')

let blobService
module.exports = {
  get blobService () {
    if (!blobService) {
      blobService = Promise.promisifyAll(azure.createBlobService(config.secure.azure.StorageConnectionString))
    }

    return blobService
  }
}
