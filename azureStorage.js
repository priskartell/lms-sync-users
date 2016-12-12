 'use strict'
 const azure = require('azure')
 const log = require('./server/init/logging')
 const fs = require('fs')
 const config = require('./server/init/configuration')
 process.env['AZURE_STORAGE_CONNECTION_STRING'] = config.secure.azure.StorageConnectionString
 const Promise = require('bluebird')
 const DocumentClient = require('documentdb').DocumentClient
 const mkdir = Promise.promisify(require('fs').mkdir)
 const pabs = Promise.promisifyAll(azure.createBlobService()) // PromiseAzureBlobService

 const HttpStatusCodes = { NOTFOUND: 404 }
 const dbClient = new DocumentClient(config.secure.azure.databaseEndPoint, {'masterKey': config.secure.azure.databaseKey})
 const azureDbClient = Promise.promisifyAll(dbClient)

 function _connectoToAzure () {
   const csvVol = config.secure.azure.csvBlobName
   const msgVol = config.secure.azure.msgBlobName
   const lmsDatabase = config.secure.azure.databaseName
   const lmsCollection = config.secure.azure.collectionName
   return cloudGetDatabase(lmsDatabase)
 .then(() => cloudGetCollection(lmsDatabase, lmsCollection))
 .then(() => log.info('Connected to database: ' + lmsDatabase + ' , Collection: ' + lmsCollection + ' successfully:'))
 .then(() => cloudCreateContainer(csvVol))
 .then(() => log.info('Created: ' + csvVol))
 .then(() => cloudCreateContainer(msgVol))
 .then(() => log.info('Created: ' + msgVol))
 .catch(error => Error(error))
 }

 _connectoToAzure()

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
     log.error('checkParameterName: parameterName not valid: ')
     throw Error('checkParameterName: parameterName not valid:')
   }
 }

 function cloudGetDatabase (databaseName) {
   return checkParameterName(databaseName)
   .then(() => {
     let databaseUrl = `dbs/${databaseName}`
     return azureDbClient.readDatabaseAsync(databaseUrl)
   })
 .catch(error => {
   if (error.code === HttpStatusCodes.NOTFOUND) {
     return azureDbClient.createDatabaseAsync({id: databaseName})
   } else {
     Promise.reject(error)
   }
 })
 }

 function cloudGetCollection (dbName, collName) {
   return checkParameterName(dbName, collName)
 .then(() => {
   let collectionUrl = `dbs/${dbName}/colls/${collName}`
   log.info("Reading collection: " + collectionUrl)
   return azureDbClient.readCollectionAsync(collectionUrl)
 })
 .catch(error => {
   if (error.code === HttpStatusCodes.NOTFOUND) {
     let databaseUrl = `dbs/${dbName}`
     let config = {id: collName}
     return azureDbClient.createCollectionAsync(databaseUrl, config, {offerThroughput: 400})
   } else {
     Promise.reject(error)
   }
 })
 }

// let collectionUrl = `dbs/${databaseId}/colls/${collectionId}`
 function cloudQueryCollection (query, collectionUrl) {
   log.info(`Querying collection through index:\n${collectionUrl}`)
   return checkParameterName(query, collectionUrl)
     .then(() => azureDbClient.queryDocumentsAsync(collectionUrl, query))
     .then(results => {
       let rArray = results.toArray(results)
       for (let queryResult of rArray) {
         let resultString = JSON.stringify(queryResult)
         log.info(`\tQuery returned ${resultString}`)
       }
       return rArray
     })
 }

 function cloudDeleteDatabase (database) {
   return checkParameterName(database)
    .then(() => {
      let databaseUrl = `dbs/${database}`
      log.info(`Cleaning up by deleting database ${databaseUrl}`)
      return azureDbClient.deleteDatabase(databaseUrl)
    })
 }

 function cloudGetDocument (document, collectionUrl) {
   return checkParameterName(document, collectionUrl)
    .then(() => {
      let documentUrl = `${collectionUrl}/docs/${document.id}`
      log.info(`Getting document:\n${document.id}\n`)
      return azureDbClient.readDocumentAsync(documentUrl)
    })
 }

 function cloudCreateDocument (document, collectionUrl) {
   return checkParameterName(document, collectionUrl)
  .then(() => {
    log.info(`Creating document: ${document.id}`)
    return azureDbClient.createDocumentAsync(collectionUrl, document)
  })
 }

 function cloudReplaceDocument (document, collectionUrl) {
   return checkParameterName(document)
    .then(() => {
      let documentUrl = `${collectionUrl}/docs/${document.id}`
      log.info(`Replacing document: ${document.id}`)
      return azureDbClient.replaceDocumentAsync(documentUrl, document)
    })
 }

 function cloudDeleteDocument (document, collectionUrl) {
   return checkParameterName(document, collectionUrl)
    .then(() => {
      let documentUrl = `${collectionUrl}/docs/${document.id}`
      log.info(`Deleting document: ${document.id}`)
      return azureDbClient.deleteDocument(documentUrl)
    })
 }

 function cloudCreateContainer (containerName) {
   return checkParameterName(containerName)
  .then(() => pabs.createContainerIfNotExistsAsync(containerName))
 }

 function cloudStoreFile (fileName, containerName) {
   return checkParameterName(fileName, containerName)
  .then(() => pabs.createBlockBlobFromLocalFileAsync(containerName, fileName, fileName))
 }

 function cloudStoreTextToExistingFile (fileName, containerName, txt) {
   return checkParameterName(fileName, containerName, txt)
  .then(() => pabs.appendFromTextAsync(containerName, fileName, txt))
 }

 function cloudStoreTextToFile (fileName, containerName, txt) {
   return checkParameterName(fileName, containerName, txt)
  .then(() => pabs.createAppendBlobFromTextAsync(containerName, fileName, txt))
 }

 function cloudListFile (containerName) {
   return checkParameterName(containerName)
  .then(() => pabs.listBlobsSegmentedAsync(containerName, null))
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
  .then(() => pabs.getBlobToStreamAsync(containerName, fileName, fs.createWriteStream(pathToStore + fileName)))
 }

 function cloudgetStream (fileName, containerName, localStream) {
   return checkParameterName(fileName, containerName, localStream)
  .then(() => pabs.getBlobToStreamAsync(containerName, fileName, localStream))
 }

 function cloudDelFile (fileName, containerName) {
   return checkParameterName(fileName, containerName)
  .then(() => pabs.deleteBlobAsync(containerName, fileName))
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
   cloudGetDatabase,
   cloudGetCollection,
   cloudQueryCollection,
   cloudGetDocument,
   cloudCreateDocument,
   cloudReplaceDocument,
   cloudDeleteDocument,
   cloudDeleteDatabase
 }
