
const dotenv = require('dotenv').config()
const { $M, Print, mset } = require('lesscode-fp')
const { Gateway } = require('./src/gateway')
const { GetSecrets } = require('./src/monads/secret')

const LogCrash = async err => Print(JSON.stringify({ type: 'crash', name: process.env.NAME, err }))
const StartServer = async env => Gateway(env).catch(err => Print(`[ERROR] : Gateway crashed : ${err}`))


// Monadic composition...
$M(StartServer, GetSecrets)((`${process.env.ECS_CLUSTER_NAME}`)).catch(LogCrash)