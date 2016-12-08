const fs = require('fs')
const log = require('./server/init/logging')

function escapeCsvData (str) {
  if (str.includes(',') || str.includes('"')) {
    log.warn('oh no! bad data!', str)
  }
  return str
}

function writeLine (strArr, fileName) {
  const line = createLine(strArr)
  fs.appendFile(fileName, line, err => {
    if (err) {
      throw err
    }
  })
}

function createLine (strArr) {
  return strArr.map(escapeCsvData).join(',') + '\n'
}

module.exports = {
  escapeCsvData, writeLine, createLine
}
