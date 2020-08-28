/**
 * FP functions for express. 
 * 1. Create new express instance           :   expCreate 
 * 2. Register SPecs or Endpoints directly  :   expRegSpec or expRegEndpoint 
 * 3. Start express                         :   expStart
 */
const { $, $M, lfold, hint, print, memoize } = require('lccore')
const { DirBrowser, SwaggerValidate } = require('./fs')
const load = memoize((path) => $(hint(`Loaded ${path}...`), require)(path)) //memoize 
const { OpenApiValidator } = require('express-openapi-validator')
const yamlParser = require('yaml')

const Hint = msg => async val => hint(msg)(val)
// express initialization...

const swaggerUi = require('swagger-ui-express')

// Load Specs, Register endpoints
const RegisterSpec = spec => async express => {
    // Endpoint execution
    const expRegEndpoint = spec => path => method => express => {
        const operationid = spec.paths[path][method].operationId
        const basepath = spec.basePath
        const expLoadOperation = () => {
            return async (req, res, next) => {
                try {
                    //print(spec.definitions)
                    try {
                        await load((`${process.cwd()}/functions/${operationid}`))(req, res, next)
                    } catch (err) {
                        next(err)
                    }
                }
                catch (err) { print(`failed to load ${process.cwd()}/functionsa/${operationid}...`); next(err) }
            }
        }
        const expRegPath2Operation = func => { express[method](path.replace('{', ':').replace('}', ''), func); return express }
        return $(hint(`${path}[${method}] => ${operationid}...`), expRegPath2Operation, expLoadOperation)()
    }
    const expRegisterPath = cat => val => { expRegEndpoint(cat.spec)(cat.path)(val)(cat.express); return cat }
    const expRegisterPaths = cat => val => { lfold({ express: cat.express, spec: cat.spec, paths: cat.paths, path: val })(expRegisterPath)(Object.keys(cat.paths[val])); return cat }
   
    return lfold({ express, spec, paths: spec.paths })(expRegisterPaths)(Object.keys(spec.paths))['express']
}


/**
 * Express monad. Accepts the port and openspec3x in json format
 * config : {
 *  port: 8080
 * }
 */
const Express = config => async jsons => {
    // initialize
    const express = require('express')()
    const bodyParser = require("body-parser")
    express.use(bodyParser.urlencoded({ extended: false }));
    express.use(bodyParser.json());

    jsons.forEach(json => {
        $M( Hint(`Registering Open API validator...`), OpenAPIValidate({ apiSpec: json, validateRequests: true, validateResponses: true }),
            Hint(`Registering Open API spec........`), RegisterSpec(json))(express)
    })

    $M(Hint('Added defualt Error handler...'), ErrorHandler)(express)

    express.listen(config.port || 8080, () => print(`Express listening at : ${config.port || 8080}`))
    return express
}

/**
 * 
 */
const SwaggerUI = config => async express => {
    print(`Registering Swagger UI with express...`)
    express.use('/', swaggerUi.serve, swaggerUi.setup(config.json))
    return express
}

const ErrorHandler = async express => {
    express.use((err, req, res, next) => {
        // format error
        res.status(err.status || 500).json({
            message: err.message,
            errors: err.errors,
        });
    })
}
/**
 * config :{ apiSpec: json, validateRequests: true, validateResponses: true }
 */
const OpenAPIValidate = config => async express => await new OpenApiValidator(config).install(express);



$M(Express({ port: 8080 }), DirBrowser()(SwaggerValidate))('rest').then().catch(err => print(`Failed to load express ${err}`))
//Export
module.exports = { Express }