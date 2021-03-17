/**
 * FP functions for express. 
 * 1. Create new express instance           :   expCreate 
 * 2. Register SPecs or Endpoints directly  :   expRegSpec or expRegEndpoint 
 * 3. Start express                         :   expStart
 */
const { $, $M, Wait, lmap, m2valList, lfold, Hint, Print, Memoize } = require('lesscode-fp')
const $R = ret => async res => ret
const load = Memoize((path) => $(require)(path)) //memoize 
const { OpenApiValidator } = require('express-openapi-validator')
const { BodyParserJSON, BodyParserURLEncoded, UUID, Start, End, Metrics, Request, Logger, CORS } = require('./middlewares')
const LatencyStart = Start('latency')
const LatencyEnd = End('latency')
const LatencyinStart = Start('latencyin')
const LatencyinEnd = End('latencyin')

//defualt middlewares
const middlewares = { BodyParserJSON, BodyParserURLEncoded, UUID, LatencyStart, LatencyEnd, Metrics, Request, Logger, CORS }

/**
 * Express monad. Accepts the config and openspec3x in json format.
 * config : {
 *  port: 8080
 * }
 */
const Express = config => async specs => {
    const RegisterSpecs = config => specs => async express => {
        // Load Specs, Register endpoints
        const RegisterSpec = config => express => async spec => {
            // Endpoint execution
            const expRegEndpoint = spec => path => method => express => {
                const operationid = spec.paths[path][method].operationId
                const basepath = spec.basePath
                const ExecFilter = req => res => async func => func(req)(res)
                const Exec = req => res => async func => load((func))(req, res)

                const expLoadOperation = () => {
                    const HandleError = req => res => async err => {
                        const SendError =res => async err => { res.status((err.status) ? err.status : 500).header('content-type', 'application/json').send(err) }
                        const LogError = req => async err => req.Logger.Error(err)
                        return await $M(SendError(res), LogError(req))(err)
                    }
                    return async (req, res, next) => {
                        req['operationid'] = operationid
                         await $M(LatencyinEnd(req, res), Exec(req)(res))(`${process.cwd()}/src/functions/${operationid}`).catch(HandleError(req)(res))
                        


                    }
                }
                const expRegPath2Operation = func => { express[method](path.replace('{', ':').replace('}', ''), func); return express }
                return $(Hint(`${path}[${method}] => ${operationid}...`), expRegPath2Operation, expLoadOperation)()
            }
            const expRegisterPath = cat => val => { expRegEndpoint(cat.spec)(cat.path)(val)(cat.express); return cat }
            const expRegisterPaths = cat => val => { lfold({ express: cat.express, spec: cat.spec, paths: cat.paths, path: val })(expRegisterPath)(Object.keys(cat.paths[val])); return cat }

            return lfold({ express, spec, paths: spec.paths })(expRegisterPaths)(Object.keys(spec.paths))['express']
        }

        return $M($R(express), Wait, lmap(RegisterSpec(config)(express)))(specs)
    }

    const RegisterShutdownHandler = signals => async express => {
        const onShutdown = express => { Print("Shutting down..."); process.exit(0) }
        const handler = func => val => process.on(val, func)
        signals.forEach(handler(onShutdown))
        return express
    }

    const RegisterErrorHandler = async express => express.use((err, req, res, next) => { res.status(err.status || 500).json({ status : err.status || 500, title : err.title, msg : err.msg}) })
    const RegisterOpenAPIValidator = config => async express => { new OpenApiValidator(config).install(express); return express }

    const RegisterMiddlewares = config => async express => {
        const RegisterMiddleware = express => middleware => express.use(middleware)
        const RegisterDefaultMiddlewares = async express => { $(lmap(RegisterMiddleware(express)), m2valList)(middlewares); return express }// register default middlewares
        const RegisterCustomMiddlewares = async express => { $(lmap(RegisterMiddleware(express)), m2valList)(config.middlewares || {}); return express }// add new / overrite 
        return $M(RegisterCustomMiddlewares, RegisterDefaultMiddlewares)(express)
    }

    const StartListener = config => async express => express.listen(config.port || 8080, () => Print(`Express listening at : ${config.port || 8080}`))
    return $M(
        Hint('Started HTTP listener................'), StartListener(config),
        Hint('Attached shutdown handler............'), RegisterShutdownHandler(['SIGINT', 'SIGTERM', 'SIGHUP']),
        Hint('Added defualt Error handler..........'), RegisterErrorHandler,
        Hint('Registering Specs....................'), RegisterSpecs(config)(specs),
        Hint('Registering middleware...............'), RegisterMiddlewares(config))(require('express')())
}

//Export
module.exports = { Express }