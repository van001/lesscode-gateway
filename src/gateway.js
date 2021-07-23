/**
 * All functions withh be writeen in FP style undeless otherwise.
 * All Monadic functions will be written using async(promises). They will be prefixed using 'm'
 * 
 * Usage: 
 * const {mGateway} require('lcgateway')
 * mGateway(8080).catch(err => print(`[ERROR] : Gateway crashed : ${err}`))
 */
const dotenv = require('dotenv').config()
const { $M, $, m2keyList, lmap } = require('lesscode-fp')
const { DirBrowser } = require('./monads/fs')
const { SwaggerValidate } = require('./monads/validators')
const { Express } = require('./monads/server')
const { GetSecrets } = require('./monads/aws')
/**
 * Gateway Monad.
 * config : {
 *  rest :  { port : 8080},
 *  graphql : { port : 8090 },
 *  mqm : {}
 * }
 */
const Gateway = async env => {

    const SetEnv = env => async name => process.env[name] = env[name]
    const SetEnvs = async env => $(lmap(SetEnv(env)), m2keyList)(env)
    const LoadConfig = ab => require(`${process.cwd()}/config`)
    const StartServer = async config => $M(Express(config), DirBrowser()(SwaggerValidate))('rest')

    return $M(StartServer, LoadConfig, SetEnvs)(env)
}

module.exports = { Gateway, GetSecrets }





