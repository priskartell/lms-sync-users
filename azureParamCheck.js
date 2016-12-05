
function _checkParamterName (parameterName) {
  return new Promise(function (resolve, reject) {
    if (!parameterName) {
      console.warn('checkParameterName: parameterName not valid: ' + parameterName + '\n\n')
      reject('checkParameterName: parameterName not valid: ')
    } else {
      resolve(true)
    }
  })
}

module.exports = {
  parameterName: _checkParamterName
}
