 'use strict'
 const azure = require('azure')
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
     console.warn('checkParameterName: parameterName not valid: ')
     throw Error('checkParameterName: parameterName not valid:')
   }
 }

 function cloudGetDatabase (databaseName) {
   let databaseUrl = `dbs/${databaseName}`
   return azureDbClient.readDatabaseAsync(databaseUrl)
 .catch(error => {
   if (error.code === HttpStatusCodes.NOTFOUND) {
     return azureDbClient.createDatabaseAsync({id: databaseName})
   } else {
     Promise.reject(error)
   }
 })
 }

/*
 function parseUrl (url, type) {
   //    let collectionUrl = `dbs/${databaseId}/colls/${collectionId}`
   if (!url) {
     throw Error('parseUrl, undefined Url' + url)
   }
   console.log('got Url:' + url)
   let myRe = /^dbs\/(\w+)\/colls\/(\w+)$/g
   let myArray = myRe.exec(url)
   if (myArray) {
     let databaseIndex = 0
     let collectionIndex = 1
     console.log('Database: ' + myArray[databaseIndex] + 'Collectoin: ' + myArray[collectionIndex])
   } else {
     throw Error('parseUrl, Invalid Url format: ' + url)
   }
   if (type === 'db') {
     return myArray[0]
   }
   if (type === 'col') {
     return myArray[1]
   } else {
     throw Error('parseUrl, unknown type' + type)
   }
 }
 */

 function cloudGetCollection (dbName, collName) {
   return checkParameterName(dbName, collName)
 .then(() => {
   let collectionUrl = `dbs/${dbName}/colls/${collName}`
   console.log(collectionUrl)
   return azureDbClient.readCollectionAsync(collectionUrl)
 })
 .catch(error => {
   if (error.code === HttpStatusCodes.NOTFOUND) {
     let databaseUrl = `dbs/${dbName}`
     let config = {id: collName}
     console.log(databaseUrl,config)
     return azureDbClient.createCollectionAsync(databaseUrl, config,{offerThroughput: 400 })
   } else {
     Promise.reject(error)
   }
 })
 }

// let collectionUrl = `dbs/${databaseId}/colls/${collectionId}`
 function cloudQueryCollection (query, collectionUrl) {
   console.log(`Querying collection through index:\n${collectionUrl}`)
   return checkParameterName(query, collectionUrl)
     .then(() => azureDbClient.queryDocumentsAsync(collectionUrl, query))
     .then(results => {
       let rArray = results.toArray(results)
       for (let queryResult of rArray) {
         let resultString = JSON.stringify(queryResult)
         console.log(`\tQuery returned ${resultString}`)
       }
       console.log()
       return rArray
     })
 }

 function cloudDeleteDatabase (database) {
   return checkParameterName(database)
    .then(() => {
      let databaseUrl = `dbs/${database}`
      console.log(`Cleaning up by deleting database ${databaseUrl}`)
      return azureDbClient.deleteDatabase(databaseUrl)
    })
 }

 function cloudGetDocument (document, collectionUrl) {
   return checkParameterName(document, collectionUrl)
    .then(() => {
      let documentUrl = `${collectionUrl}/docs/${document.id}`
      console.log(`Getting document:\n${document.id}\n`)
      return azureDbClient.readDocumentAsync(documentUrl)
    })
 }

 function cloudCreateDocument (document, collectionUrl) {
   return checkParameterName(document, collectionUrl)
  .then(() => {
    console.log(`Creating document:\n${document.id}\n`)
    return azureDbClient.createDocumentAsync(collectionUrl, document)
  })
 }

 function cloudReplaceDocument (document, collectionUrl) {
   return checkParameterName(document)
    .then(() => {
      let documentUrl = `${collectionUrl}/docs/${document.id}`
      console.log(`Replacing document:\n${document.id}\n`)
      return azureDbClient.replaceDocumentAsync(documentUrl, document)
    })
 }

 function cloudDeleteDocument (document, collectionUrl) {
   return checkParameterName(document, collectionUrl)
    .then(() => {
      let documentUrl = `${collectionUrl}/docs/${document.id}`
      console.log(`Deleting document:\n${document.id}\n`)
      return azureDbClient.deleteDocument(documentUrl)
    })
 }

// let collectionUrl = `dbs/${databaseId}/colls/${collectionId}`
 cloudGetDatabase(config.secure.azure.databaseName)
.then(() => console.log(`Database connected successfully: ` + config.secure.azure.databaseName))
.then(() => cloudGetCollection(config.secure.azure.databaseName,config.secure.azure.collectionName))
.then(() => console.log(`Collection connected successfully: ` + config.secure.azure.collectionName))
.catch(error => console.log('Completed with error', error))

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
        console.info('Deleteing file: ' + fileObj.name + ' from Azure...')
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
        console.info('Getting file: ' + fileObj.name + ' from Azure, storeing to:' + directory)
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
