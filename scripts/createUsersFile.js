const Promise = require('bluebird')

const fs = require('fs')
const readFile = Promise.promisify(fs.readFile)

const csvFile = require('../csvFile')
const usersFileName = 'csv/allUsersFile.csv'
const filename = '20171120-users-incorrect-names.csv'
//const filename = 'allUsers.csv'

async function fetchUsers () {
    try {
        //await csvFile.writeLine(['user_id', 'login_id', 'first_name', 'last_name', 'email', 'status'], usersFileName)
        const usersFromCsvFile = await readFile(filename, 'utf8')
        const stringsArr = usersFromCsvFile.split('\r')

        stringsArr.map(line => {
            kthId = line.split(';')[1]
            
        })


        //console.log("Line ", usersIds)
    } catch(e) {
        console.log('error: ', e)
    }
}

fetchUsers()