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
const cors = require('cors')
const bodyParser = require('body-parser')
const ua = require('useragent')

//defualt middlewares
const middlewares = {
    BodyParserJSON: bodyParser.json(),
    BodyParserURLEncoded: bodyParser.urlencoded({ extended: false }),
    UUID: (req, res, next) => { req.uuid = req.headers.uuid || uuidv1(); res.header('uuid', req.uuid); next() },
    Start: (req, res, next) => { req['Start'] = Date.now(); next() },
    End: (req, res, next) => { res.on("finish", function () { res['End'] = Date.now() }); next() },
    Metrics: (req, res, next) => {
        res.on("finish",
            function () {
                Print(JSON.stringify(
                    {
                        uuid: req.uuid,
                        env: process.env.ENV,
                        region: process.env.REGION,
                        type: 'metrics',
                        method: req.method,
                        status: res.statusCode,
                        url: req.path,
                        length: res.get('content-length'),
                        latency: res.End - req.Start,
                        ts: Date.now()
                    }))
            }
        )
        next()
    },
    Request: (req, res, next) => {
       
        Print(JSON.stringify(
            {
                uuid: req.uuid,
                env: process.env.ENV,
                region: process.env.REGION,
                user: req.user,
                type: 'request',
                method: req.method,
                useragent: ua.parse(req.headers['user-agent']),
                url: req.path,
                query: req.query,
                body: req.body,
                length: req.get('content-length'),
                ts: Date.now()
            }))
        next()
    },
    Logger: (req, res, next) => {
        req['Logger'] = {
            Info: async (msg) => { $M($R({ msg }), Print)(JSON.stringify({ uuid: req.uuid, type: 'info', method: req.method, url: req.path, operationid: req.operationid, msg: msg, ts: Date.now() })) },
            Warning: async (msg) => { $M($R({ msg }), Print)(JSON.stringify({ uuid: req.uuid, type: 'warning', method: req.method, url: req.path, operationid: req.operationid, msg: msg, ts: Date.now() })) },
            Error: async (err) => { $M($R({ err }), Print)(JSON.stringify({ uuid: req.uuid, type: 'error', method: req.method, url: req.path, operationid: req.operationid, err: err, ts: Date.now() })) }
        }
        next()
    },
    CORS: cors()
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
                    return async (req, res, next) => {
                        req['operationid'] = operationid
                        await $M(Exec(req)(res))(`${process.cwd()}/src/functions/${operationid}`).catch(HandleError(req)(res))

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

    const RegisterErrorHandler = async express => express.use((err, req, res, next) => { res.status(err.status || 500).json({ err }) })
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