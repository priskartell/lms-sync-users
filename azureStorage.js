 'use strict'
 const azure = require('azure')
 const fs = require('fs')
 const config = require('./server/init/configuration')
 const check = require('./azureParamCheck')
 process.env['AZURE_STORAGE_CONNECTION_STRING'] = config.secure.azure.StorageConnectionString
 const Promise = require('bluebird')
 const mkdir = Promise.promisify(require('fs').mkdir)
 const pz = Promise.promisifyAll(azure.createBlobService())

 function _createContainerInAzure (containerName) {
   return check.parameterName(containerName)
  .then(() => pz.createContainerIfNotExistsAsync(containerName))
 }

 function _storeFiletoAzure (fileName, containerName) {
   return check.parameterName(fileName)
  .then(() => check.parameterName(containerName))
  .then(() => pz.createBlockBlobFromLocalFileAsync(containerName, fileName, fileName))
 }

 function _storeTexttoExistingFileAzure (fileName, containerName, txt) {
   return check.parameterName(fileName)
  .then(() => check.parameterName(containerName))
  .then(() => check.parameterName(txt))
  .then(() => pz.appendFromTextAsync(containerName, fileName, txt))
 }

 function _storeTexttoFileAzure (fileName, containerName, txt) {
   return check.parameterName(fileName)
  .then(() => check.parameterName(containerName))
  .then(() => check.parameterName(txt))
  .then(() => pz.createAppendBlobFromTextAsync(containerName, fileName, txt))
 }

 function _listFilesInAzure (containerName) {
   return check.parameterName(containerName)
  .then(() => pz.listBlobsSegmentedAsync(containerName, null))
  .then(result => {
    let transLogListCsv = ''
    let transArrayText = JSON.stringify(result.entries)
    let transArray = JSON.parse(transArrayText)
    let counter = 0
    transArray.forEach(trans => { counter += 1; transLogListCsv = transLogListCsv + '[ ' + counter + ' ] ' + trans.name + '    ' + trans.lastModified + '\n' })
    if (transArray.length > 0) {
      console.log(transLogListCsv)
    } else {
      console.log('[]')
    }
    return {fileArray: transArray, fileList: transLogListCsv}
  })
 }

 function _pruneFilesFromAzure (anArray, miliSecondDate, containerName, timeIndexInFileName) {
   anArray.forEach(fileObj => {
     let fileName = fileObj.name
    // let timeIndexInFileName = 3 // enrollments.STUDENTS.LH221VVT161.1480532056928.csv
     let timeStamp = parseInt(fileName.split('.')[timeIndexInFileName])
     if (timeStamp <= miliSecondDate) {
       console.info('Deleteing file: ' + fileName + ' from Azure...')
       _delFileFromAzure(fileName, containerName)
     }
     return
   })
 }

 function _delFilesInAzureBeforeDate (date, containerName, timeIndexInFileName) {
   let thisDate = date.getTime()
   return check.parameterName(thisDate)
  .then(() => check.parameterName(containerName))
  .then(() => check.parameterName(timeIndexInFileName))
  .then(() => _listFilesInAzure(containerName))
  .then(msgObj => _pruneFilesFromAzure(msgObj.fileArray, thisDate, containerName, timeIndexInFileName))
 }

 function _getFileFromAzure (fileName, containerName, pathToStore) {
   return mkdir(pathToStore)
   .catch(err => {
     if (err.code === 'EEXIST') {
       return
     } else {
       Promise.reject(err)
     }
   })
  .then(() => check.parameterName(fileName))
  .then(() => check.parameterName(containerName))
  .then(() => check.parameterName(pathToStore))
  .then(() => pz.getBlobToStreamAsync(containerName, fileName, fs.createWriteStream(pathToStore + fileName)))
 }

 function _getStreamFromAzure (fileName, containerName, localStream) {
   return check.parameterName(fileName)
  .then(() => check.parameterName(containerName))
  .then(() => check.parameterName(localStream))
  .then(() => pz.getBlobToStreamAsync(containerName, fileName, localStream))
 }

 function _delFileFromAzure (fileName, containerName) {
   return check.parameterName(fileName)
  .then(() => check.parameterName(containerName))
  .then(() => pz.deleteBlobAsync(containerName, fileName))
 }

 module.exports = {
   cloudStore: _storeFiletoAzure,
   cloudListFile: _listFilesInAzure,
   cloudgetFile: _getFileFromAzure,
   cloudgetStream: _getStreamFromAzure,
   cloudDelFile: _delFileFromAzure,
   cloudStoreTextToFile: _storeTexttoFileAzure,
   cloudDeleteFilesBeforeDate: _delFilesInAzureBeforeDate,
   cloudCreateContainer: _createContainerInAzure,
   cloudStoreTextToExistingFile: _storeTexttoExistingFileAzure
 }
