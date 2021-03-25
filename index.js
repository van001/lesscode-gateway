const { Print } = require('lesscode-fp')
const { Gateway } = require('./src/gateway')

Gateway({DB_PASSWORD : '23'}).catch(err => Print(`[ERROR] : Gateway crashed : ${err}`))