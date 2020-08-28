/**
 * All functions withh be writeen in FP style undeless otherwise.
 * All Monadic functions will be written using async(promises). They will be prefixed using 'm'
 * 
 * Usage: 
 * const {mGateway} require('lcgateway')
 * mGateway(8080).catch(err => print(`[ERROR] : Gateway crashed : ${err}`))
 */

const { $, hint, print, lmap} = require('lccore') // lccore
const { expCreate, expStart, expRegSpec} = require('./rest/express') //express fp
const { DirLoad, Yaml2Json, OpenSpecValidator } = require('./async/Dir')
const  Express  = require('./async/Express')


/**
 * Call this method to start the gateway
 * mGateway :: 
 */
async function mGateway(port) {
    //load REST specs

    Express(8080)(`${process.cwd()}/rest`).catch( err => print(err))
    /**DirLoad($(OpenSpecValidator,Yaml2Json))('rest').then( jsons => {
        print(jsons)
        $(
            hint('Started server....................'), expStart(port),
            hint('Registered endpoints from specs...'), lmap(expRegSpec)(jsons),
            hint('Created express...................'), expCreate)()
    }).catch( err => print(err) )**/
    //load GraphQL specs
    //load MQM specs
}
mGateway(8080).catch(err => print(`[ERROR] : Gateway crashed : ${err}`))
module.exports = { mGateway }

//var toJsonSchema = require('@openapi-contrib/openapi-schema-to-json-schema');
//toJsonSchema()







