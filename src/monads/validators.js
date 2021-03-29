const parser = require('@apidevtools/swagger-parser')
/**
 * Validates swagger and returns json. 
 */
const SwaggerValidate = async content => parser.validate(content)

module.exports = { SwaggerValidate }