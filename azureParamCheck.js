
function _checkParamterName (parameterName) {
  let callee = arguments.callee.caller
  //let caller =  arguments.callee.caller.name.toString()
//  console.warn("\nIn: " +  arguments.callee.caller.name.toString() + "\n" )
  return new Promise(function (resolve, reject) {
    if (!parameterName) {
      console.warn('checkParameterName: parameterName not valid: ' + parameterName + '\n')
      reject('checkParameterName: parameterName not valid: ' + parameterName + " " +  callee )
    } else {
      resolve(true)
    }
  })
}

module.exports = {
  parameterName: _checkParamterName
}
