/**
 * FP functions for express. 
 * 1. Create new express instance           :   expCreate 
 * 2. Register SPecs or Endpoints directly  :   expRegSpec or expRegEndpoint 
 * 3. Start express                         :   expStart
 */
const { $, $M, lfold, hint, print, memoize } = require('lesscode-fp')
const load = memoize((path) => $(hint(`Loaded ${path}...`), require)(path)) //memoize 
const { OpenApiValidator } = require('express-openapi-validator')
const swaggerUi = require('swagger-ui-express')
const Hint = msg => async val => hint(msg)(val)

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
                        let start = Date.now()
                        await load((`${process.cwd()}/src/functions/${operationid}`))(req, res, next)
                        print(JSON.stringify({method, status : res.statusCode, url : path, latency : Date.now()-start}))
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


const SwaggerUI = config => async express => {
    print(`Registering Swagger UI with express...`)
    express.use('/', swaggerUi.serve, swaggerUi.setup(config.json))
    return express
}

const StartListener = config => async express => express.listen(config.port || 8080, () => print(`Express listening at : ${config.port || 8080}`))

const HandleShutdown = signals => async express => {
    const onShutdown = express => { print("Shutting down..."); process.exit(0) }
    const handler = func => val => process.on(val, func)
    signals.forEach(handler(onShutdown))
    return express
}

const HandleError = async express => {
    express.use((err, req, res, next) => {
        // format error
        res.status(err.status || 500).json({
            message: err.message,
            errors: err.errors,
        });
    })
    return express
}

/**
 * config :{ apiSpec: json, validateRequests: true, validateResponses: true }
 */
const OpenAPIValidate = config => async express => await new OpenApiValidator(config).install(express);

/**
 * Express monad. Accepts the config and openspec3x in json format.
 * config : {
 *  port: 8080
 * }
 */
const Express = config => async jsons => {
    // initialize
    const express = require('express')()
    const Init = async express => {
        const bodyParser = require("body-parser")
        express.use(bodyParser.urlencoded({ extended: false }));
        express.use(bodyParser.json());
        return express
    }

    jsons.forEach(json => {
        //Hint(`Registering Open API validator...`), OpenAPIValidate({ apiSpec: json, validateRequests: true, validateResponses: true })
        $M( Hint(`Registering Open API spec........`), RegisterSpec(json))(express)
    })
    
    $M( Hint('Attached shutdown handler............'), HandleShutdown(['SIGINT', 'SIGTERM', 'SIGHUP']),
        Hint('Started HTTP listener................'), StartListener(config),
        Hint('Added defualt Error handler..........'), HandleError,
        Hint('Initialzed express...................'), Init)(express)
        
    return express
}


//$M(Express({ port: 8080 }), DirBrowser()(SwaggerValidate))('rest').then().catch(err => print(`Failed to load express ${err}`))
//Export
module.exports = { Express }