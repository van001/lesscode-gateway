const { $M, Print, lmap, lmapA, mget, mslice } = require('lesscode-fp')
const { SwaggerValidate } = require('../monads/validators')
const { DirBrowser } = require('../monads/fs')
module.exports = async function (req, res) { 
    const Result = res => async spec => res.send(spec[0])
    return $M(Result(res), Print, DirBrowser()(SwaggerValidate))('rest').catch(Print)
}