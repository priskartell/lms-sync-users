const ugParser = require('./ugParser')
module.exports = function(msg){
  const {courseCode,shortYear, term} = ugParser.parseKeyReRegistered(msg.ug1Name)
  return 1
}

// const message = {
//   ugClass: 'group',
//   ug1Name: `ladok2.kurser.${courseCode0}.${courseCode1}.omregistrerade_20171`,
//   member: [userKthId]}

// { ugClass: 'group',
      // ug1Name: 'ladok2.kurser.AG.1b9l.omregistrerade_20171',
      // member: [ 'u1znmoik' ] }
