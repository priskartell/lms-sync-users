'use strict'
const azure = require('azure')
const fs = require('fs')
const config = require('./server/init/configuration')
process.env['AZURE_STORAGE_CONNECTION_STRING'] = config.secure.azure.StorageConnectionString
const blobSvc = azure.createBlobService()

function _createContainer (cName) {
  blobSvc.createContainerIfNotExists(cName, function (error, result, response) {
    if (error) {
      console.info(error)
      throw error
    }

    if (result && result.created === true) {
      console.info(`Just created the ${cName} container`)
    } else {
      console.info(`Container ${cName} already exist`)
    }
  })
}

function _storeFiletoAzure (fileName) {
  if (!fileName) {
    console.warn('storeFileToAzure, fileName not valid: ' + fileName)
    return Promise.reject(new Error('storeFileToAzure, fileName not valid: ' + fileName))
  }

  let directoryIndex = 6
  let filetypeIndex = -3
  let parsedFileName = fileName.substring(directoryIndex)
  let container = 'lms' + fileName.slice(filetypeIndex)

  console.info('type of container: ' + container)

  return new Promise(function (resolve, reject) {
    blobSvc.createBlockBlobFromLocalFile(container, parsedFileName, fileName, function (error, result, response) {
      if (error) {
        console.warn('storeFileToAzure', error)
        reject(error)
      }
      resolve(result)
    })
  })
}

function _storeTexttoFileAzure (fileName, txt) {
  if (!fileName) {
    console.warn('storeFileToAzure, fileName not valid: ' + fileName)
    return Promise.reject(new Error('_storeTexttoFileAzure, fileName not valid: ' + fileName))
  }

  fileName = fileName.trim()
  let filetypeIndex = -3
  let containerName = 'lms' + fileName.slice(filetypeIndex)
  let accept = (containerName === 'lmsmsg' || containerName === 'lmscsv')
  if (!accept) {
    console.info('_storeTexttoFileAzure: Invalid container name: ' + containerName + '\n')
    return
  }
  console.info('type of container: ' + containerName)

  return new Promise(function (resolve, reject) {
    blobSvc.createAppendBlobFromText(containerName, fileName, txt, function (error, result, response) {
      if (!error) {
        resolve(result)
      } else {
        reject(error)
      }
    })
  })
}

function _listFilesInAzure (containerName) {
  let accept = (containerName === 'lmsmsg' || containerName === 'lmscsv')

  if (!accept) {
    console.info('listFilesInAzure: Invalid container name: ' + containerName + '\n')
    return
  }

  blobSvc.listBlobsSegmented(containerName, null, function (error, result, response) {
    if (!error) {
      let transLogListCsv = ''
      let transArrayText = JSON.stringify(result.entries)
      let transArray = JSON.parse(transArrayText)
      let counter = 0
      console.info("listing files in cloud container: " + containerName + "\n")
      transArray.forEach(trans => { counter += 1; transLogListCsv = transLogListCsv + "[ " + counter + " ] " +  trans.name + '    ' + trans.lastModified + '\n' })
      console.log(transLogListCsv)
      return transArray
      // result.entries contains the entries
      // If not all blobs were returned, result.continuationToken has the continuation token.
    } else { // Error
      console.warn('listFileInAzure', error.statusCode)
      if (error.statusCode === 404) {
        _createContainer('lmscsv')
        _createContainer('lmsmsg')
        return
      }
      throw error
    }
  })
}

function _getFileFromAzure (fileName) {
  if (!fileName) {
    console.warn('getFileToAzure, fileName not valid: ' + fileName + '\n')
    return
  }

  fileName = fileName.trim()
  let filetypeIndex = -3
  let container = 'lms' + fileName.slice(filetypeIndex)

  blobSvc.getBlobToStream(container, fileName, fs.createWriteStream(fileName), function (error, result, response) {
    if (!error) {
      console.info('File: ' + fileName + 'retrived from Azure....\n')
      return
    }
    console.log(error)
    return
  })
}

function _delFileFromAzure (fileName) {
  if (!fileName) {
    console.warn('getFileToAzure, fileName not valid: ' + fileName + '\n')
    return
  }

  fileName = fileName.trim()
  let filetypeIndex = -3
  let container = 'lms' + fileName.slice(filetypeIndex)

  blobSvc.deleteBlob(container, fileName, function (error, response) {
    if (!error) {
      console.info('File: ' + fileName + ' Deleted from Azure....\n')
      return
    }
    console.log(error.message)
    return
  })
}

_listFilesInAzure('lmscsv')
_listFilesInAzure('lmsmsg')

// _getFileFromAzure("enrollments.STUDENTS.DM1578VT152.1480494800005.csv  ")
// _delFileFromAzure("enrollments.STUDENTS.DM1578VT152.1480494800005.csv  ")
// _storeTexttoFileAzure ("payam.csv","hej testar skapa en fil med detta content").then(result=>console.log(result))
// .catch(error=>console.log(error))
// _delFileFromAzure('payam.csv')

module.exports = {
  cloudStore: _storeFiletoAzure,
  cloudListFile: _listFilesInAzure,
  cloudgetFile: _getFileFromAzure,
  cloudDelFile: _delFileFromAzure,
  cloudStoreTextToFile: _storeTexttoFileAzure
}
