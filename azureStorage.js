'use strict'
const azure = require('azure')
const config = require('./server/init/configuration')
process.env["AZURE_STORAGE_CONNECTION_STRING"] = config.secure.azure.StorageConnectionString;
const blobSvc = azure.createBlobService()

function _createContainer (cName) {
    blobSvc.createContainerIfNotExists(cName, function(error, result, response){
    if(error){
      console.info(error)
    }
    if (result.created == true){
      console.info(`Just created the ${cName} container`)
    }
    else {
      console.info(`Container ${cName} already exst`)
    }
});
}

function _storeFiletoAzure(fileName){
  if (!fileName) {
    console.warn("storeFileToAzure, fileName not valid: " + fileName)
    return Promise.reject(new Error("storeFileToAzure, fileName not valid: " + fileName))
  }

  let parsedFileName = fileName.substring(6)
  let container = "lms" + fileName.slice(-3)

  console.info("type of container: " + container)

return new Promise(function(resolve, reject) {
  blobSvc.createBlockBlobFromLocalFile(container,parsedFileName,fileName, function(error, result, response){
    if(error){
      console.warn("storeFileToAzure",error)
      reject(error)
    }
    resolve(result)
  })
})
}

_createContainer("lmscsv")
_createContainer("lmsmsg")

module.exports = {
  cloudStore: _storeFiletoAzure
}
