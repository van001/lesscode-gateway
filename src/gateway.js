/**
 * All functions withh be writeen in FP style undeless otherwise.
 * All monadic functions will be written wusing promises. They will be prefixed using 'm'
 * 
 * Usage: 
 * const {mGateway} require('lcgateway')
 * mGateway(8080).catch(err => print(`[ERROR] : Gateway crashed : ${err}`))
 */

const { $, hint, print} = require('lccore') // lccore
const { expCreate, expStart, expRegSpecs } = require('./rest/express') //express fp
const { mDirLoad } = require('./dir.js')
const REST_FOLDER = 'rest'


/**
 * Call this method to start the gateway
 * @param {*} port 
 */
async function mGateway(port) {
    //load REST specs
    mDirLoad(REST_FOLDER).then(specs => {
        $(
            hint('Started server....................'), expStart(port),
            hint('Registered endpoints from specs...'), expRegSpecs(specs),
            hint('Created express...................'), expCreate)(process.cwd())
    })
    //load graphQL specs
}
mGateway(8080).catch(err => print(`[ERROR] : Gateway crashed : ${err}`))
module.exports = { mGateway }






