const fs = require('fs')
const log = require('./server/init/logging')

function escapeCsvData (str) {
  if (str.includes(',') || str.includes('"')) {
    log.error('oh no! bad data!', str)
  }
  return str
}

function writeLine (strArr, fileName) {
  const line = strArr.map(escapeCsvData).join(',') + '\n'
  fs.appendFile(fileName, line, err => {
    if (err) {
      throw err
    }
  })
}

module.exports = {
  escapeCsvData, writeLine
}
