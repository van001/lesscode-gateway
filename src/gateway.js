/**
 * All functions withh be writeen in FP style undeless otherwise.
 * All Monadic functions will be written using async(promises). They will be prefixed using 'm'
 * 
 * Usage: 
 * const {mGateway} require('lcgateway')
 * mGateway(8080).catch(err => print(`[ERROR] : Gateway crashed : ${err}`))
 */

const { $M, print } = require('lccore') // lccore
const { DirBrowser, SwaggerValidate } = require('./monads/fs')
const { Express } = require('./monads/server')

/**
 * Gateway Monad.
 * config : {
 *  rest :  { port : 8080},
 *  graphql : { port : 8090 },
 *  mqm : {}
 * }
 */
const Gateway = async config => {
    if (config.rest) {
        await $M(Express(config.rest), DirBrowser()(SwaggerValidate))('rest')
    }
}

//Gateway({ rest: { port: 8080 } }).catch(err => print(`[ERROR] : Gateway crashed : ${err}`))
module.exports = { Gateway }







