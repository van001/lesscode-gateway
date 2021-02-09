/**
 * FP functions for express. 
 * 1. Create new express instance           :   expCreate 
 * 2. Register SPecs or Endpoints directly  :   expRegSpec or expRegEndpoint 
 * 3. Start express                         :   expStart
 */
const { $, $M, M, Wait, lmap, m2valList, lfold, Hint, Print, Memoize } = require('lesscode-fp')
const $R = ret => async res => ret
const load = Memoize((path) => $(require)(path)) //memoize 
const { OpenApiValidator } = require('express-openapi-validator')
const { v1: uuidv1 } = require('uuid')
const cors = require('cors');

// Filters
const Start = req => async res => { req['Start'] = Date.now() }
const End = req => async res => { res['End'] = Date.now() }
const UUID = req => async res => { req['UUID'] = uuidv1(); res.header('x-uuid', req.UUID) }
const Metrics = req => async res => { Print(JSON.stringify({ uuid: req.UUID, type: 'metrics', method: req.method, status: res.statusCode, url: req.path, latency: res.End - req.Start, ts: Date.now() })) }
const Logger = req => async res => {
    req['Logger'] = {
        Info: async (msg) => { $M($R({ msg }), Print)(JSON.stringify({ uuid: req.UUID, type: 'info', method: req.method, url: req.path, operationid : req.operationid, msg: msg, ts: Date.now() })) },
        Warning: async (msg) => { $M($R({ msg }), Print)(JSON.stringify({ uuid: req.UUID, type: 'warning', method: req.method, url: req.path, operationid : req.operationid, msg: msg, ts: Date.now() })) },
        Error: async (err) => { $M($R({ err }), Print)(JSON.stringify({ uuid: req.UUID, type: 'error', method: req.method, url: req.path, operationid : req.operationid, err: err, ts: Date.now() })) }
    }
}

const Config = req => async res => {}

// default filters
const filters = {
    req: { Start, UUID, Logger},
    res: { End, Metrics }
}

//defualt middlewares
const middlewares = {
    CORS : cors()
}

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
                        const SendError = req => res => err => { res.status(500).header('content-type', 'application/json').send(err) }
                        const LogError = req => res => async err => $M($R({ err }), Print)(JSON.stringify({ uuid: req.UUID, type: 'error', method: req.method, url: req.path, err: err, ts: Date.now() }))
                        return await $M(SendError(req)(res), LogError(req)(res))(err)
                    }
                    return async (req, res) => {
                        req['operationid'] = operationid
                        await $M(Wait, lmap(ExecFilter(req)(res)))(m2valList(filters.req))
                        await $M(Exec(req)(res))(`${process.cwd()}/src/functions/${operationid}`).catch(HandleError(req)(res))
                        await $M(Wait, lmap(ExecFilter(req)(res)))(m2valList(filters.res))
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

    const RegisterErrorHandler = async express => express.use((err, req, res, next) => {res.status(err.status || 500).json({ err }); })
    const RegisterOpenAPIValidator = config => async express => { new OpenApiValidator(config).install(express); return express }
    
    const RegisterMiddlewares = config => express => { 
        const RegisterMiddleware = express => middleware => { console.log(`registering ${middleware}`); express.use(middleware)}
        $(lmap(RegisterMiddleware(express)), m2valList)(middlewares)
        return express
    }

    const StartListener = config => async express => express.listen(config.port || 8080, () => Print(`Express listening at : ${config.port || 8080}`))
    return $M(
        Hint('Started HTTP listener................'), StartListener(config),
        Hint('Registering middleware...............'), RegisterMiddlewares(config),
        Hint('Attached shutdown handler............'), RegisterShutdownHandler(['SIGINT', 'SIGTERM', 'SIGHUP']),
        Hint('Added defualt Error handler..........'), RegisterErrorHandler,
        Hint('Registering Specs....................'), RegisterSpecs(config)(specs))(require('express')())
}

//Export
module.exports = { Express }