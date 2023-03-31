const { $, Print, lflat, lfold, lmap, m2valList, m2keyList } = require('lesscode-fp')
let discriminatorsMap = {}
const nxt = next => res => next()
const error = res => async err => res.status((err.status) ? err.status : 500).json(err)
const validate = req => schema => {

    if(req.body[schema.discriminator.propertyName]){

    }else{
        throw { status: 400, errors  : [{label :`${schema.discriminator.propertyName}`, msg : 'is required', type : 'body'}]}
    }
    
    console.log(req.body,schema)
}

/**
 * {
  oneOf: [
    {
      type: 'object',
      discriminator: [Object],
      properties: [Object],
      additionalProperties: false,
      required: [Array]
    },
    {
      type: 'object',
      discriminator: [Object],
      properties: [Object],
      required: [Array],
      additionalProperties: false
    }
  ],
  discriminator: {
    propertyName: 'grant_type',
    mapping: {
      client_credentials: '#/components/schemas/ClinetCredentials',
      'urn:ietf:params:oauth:grant-type:token-exchange': '#/components/schemas/TokenExchange'
    }
  }
}
 */
let mapDiscriminators = config => {
    const filterDiscriminators = lst => {
        const addDiscriminator = cat => val => {
            const res = $(m2valList)(val.requestBody.content)
            //console.log(res[0].schema.oneOf)
            cat[val.operationId] = res[0].schema; return cat
        }
        const hasDiscriminator = body => { const val = $(m2valList)(body.content); return (val[0].schema.oneOf) ? true : false }
        const includeDiscriminator = cat => val => (val.requestBody && hasDiscriminator(val.requestBody)) ? addDiscriminator(cat)(val) : cat
        return lfold(discriminatorsMap)(includeDiscriminator)(lst)
    }
    return $(filterDiscriminators, lflat, lmap(m2valList), m2valList)(config)
}


const filter = () => (req, res, next) => $(nxt(next), validate(req))(discriminatorsMap[req.operationid])

module.exports = config => $(filter, mapDiscriminators)(config.apiSpec.paths)

