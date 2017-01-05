 'use strict'
 const azure = require('./azure')
 const log = require('./server/init/logging')
 const fs = require('fs')
 const config = require('./server/init/configuration')

 const Promise = require('bluebird')
 const mkdir = Promise.promisify(require('fs').mkdir)

 function cloudConnect () {
   const csvVol = config.secure.azure.csvBlobName
   const msgVol = config.secure.azure.msgBlobName
   return cloudCreateContainer(csvVol)
 .then(() => log.info('Created: ' + csvVol))
 .then(() => cloudCreateContainer(msgVol))
 .then(() => log.info('Created: ' + msgVol))
 .catch(error => Error(error))
 }

 function checkParameterName (...p) {
   let result = true
   p.forEach(parameter => {
     if (!parameter) {
       result = false
     }
   })

   if (result) {
     return Promise.resolve(result)
   } else {
     throw new Error('checkParameterName: parameterName not valid: ')
   }
 }

 function cloudCreateContainer (containerName) {
   return checkParameterName(containerName)
  .then(() => azure.blobService.createContainerIfNotExistsAsync(containerName))
 }

 function cloudStoreFile (fileName, containerName) {
   return checkParameterName(fileName, containerName)
  .then(() => azure.blobService.createBlockBlobFromLocalFileAsync(containerName, fileName, fileName))
 }

 function cloudStoreTextToExistingFile (fileName, containerName, txt) {
   return checkParameterName(fileName, containerName, txt)
  .then(() => azure.blobService.appendFromTextAsync(containerName, fileName, txt))
 }

 function cloudStoreTextToFile (fileName, containerName, txt) {
   return checkParameterName(fileName, containerName, txt)
  .then(() => azure.blobService.createAppendBlobFromTextAsync(containerName, fileName, txt))
 }

 function cloudListFile (containerName) {
   return checkParameterName(containerName)
  .then(() => azure.blobService.listBlobsSegmentedAsync(containerName, null))
  .then(result => {
    let transLogListCsv = ''
    let transArrayText = JSON.stringify(result.entries)
    let transArray = JSON.parse(transArrayText)
    let counter = 0
    transArray.forEach(trans => { counter += 1; transLogListCsv = transLogListCsv + '[ ' + counter + ' ] ' + trans.name + '    ' + trans.lastModified + '\n' })
    if (transArray.length > 0) {
      log.info(transLogListCsv)
    } else {
      log.info('[]')
    }
    return {fileArray: transArray, fileList: transLogListCsv}
  })
 }

 function getTimeStampFromFile (fileName, timeIndexInFileName) {
   let timeStamp = parseInt(fileName.split('.')[timeIndexInFileName])
   if (!timeStamp) {
     throw Error('Can not get time stamp from fileName:' + fileName)
   }
   return timeStamp
 }

 function cloudDeleteFilesBeforeDate (date, containerName, timeIndexInFileName) {
   let thisDate = date.getTime()
   return checkParameterName(thisDate, containerName, timeIndexInFileName)
  .then(() => cloudListFile(containerName))
  .then(msgObj => {
    msgObj.fileArray.forEach(fileObj => {
      let timeStamp = getTimeStampFromFile(fileObj.name, timeIndexInFileName)
      if (timeStamp <= thisDate) {
        log.info('Deleteing file: ' + fileObj.name + ' from Azure...')
        cloudDelFile(fileObj.name, containerName)
      }
    })
    return msgObj.fileArray
  })
 }

 function cloudGetFilesBeforeDate (date, containerName, timeIndexInFileName, directory) {
   let thisDate = date.getTime()
   return checkParameterName(thisDate, containerName, timeIndexInFileName, directory)
  .then(() => cloudListFile(containerName))
  .then(msgObj => {
    msgObj.fileArray.forEach(fileObj => {
      let timeStamp = getTimeStampFromFile(fileObj.name, timeIndexInFileName)
      if (timeStamp <= thisDate) {
        log.info('Getting file: ' + fileObj.name + ' from Azure, storeing to:' + directory)
        cloudgetFile(fileObj.name, containerName, directory)
      }
    })
    return msgObj.fileArray
  })
 }

 function cloudgetFile (fileName, containerName, pathToStore) {
   if (!pathToStore) {
     pathToStore = './tmp/'
   }
   return mkdir(pathToStore)
   .catch(err => {
     if (err.code === 'EEXIST') {
       return
     } else {
       Promise.reject(err)
     }
   })
  .then(() => checkParameterName(fileName, containerName))
  .then(() => azure.blobService.getBlobToStreamAsync(containerName, fileName, fs.createWriteStream(pathToStore + fileName)))
 }

 function cloudgetStream (fileName, containerName, localStream) {
   return checkParameterName(fileName, containerName, localStream)
  .then(() => azure.blobService.getBlobToStreamAsync(containerName, fileName, localStream))
 }

 function cloudDelFile (fileName, containerName) {
   return checkParameterName(fileName, containerName)
  .then(() => azure.blobService.deleteBlobAsync(containerName, fileName))
 }

 module.exports = {
   cloudStoreFile,
   cloudListFile,
   cloudgetFile,
   cloudgetStream,
   cloudDelFile,
   cloudStoreTextToFile,
   cloudDeleteFilesBeforeDate,
   cloudCreateContainer,
   cloudStoreTextToExistingFile,
   cloudGetFilesBeforeDate,
   cloudConnect
 }
