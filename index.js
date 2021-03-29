
const { $M, $, Print, m2valList } = require('lesscode-fp')
const { Gateway, GetSecrets } = require('./src/gateway')

const LogCrash = async err => Print(JSON.stringify({ type: 'crash', name: process.env.NAME, err }))
const StartServer = async env => Gateway(env)

// Monadic composition...
$M(StartServer, GetSecrets)((`${process.env.ECS_CLUSTER_NAME}`)).catch(LogCrash)