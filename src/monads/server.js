/**
 * FP functions for express. 
 * 1. Create new express instance           :   expCreate 
 * 2. Register SPecs or Endpoints directly  :   expRegSpec or expRegEndpoint 
 * 3. Start express                         :   expStart
 */

 const { $, $M, Wait, lmap, m2valList, lfold, Hint, Print, Memoize, lappend } = require('lesscode-fp')
 const $R = ret => async res => ret
 const load = Memoize((path) => $(require)(path)) //memoize 
 const OpenApiValidator = require('express-openapi-validator')
 const { formatErrors, formatTitle, getOperationId } = require('../monads/error')
 const { BodyParserJSON, BodyParserURLEncoded, UUID, Start, End, Metrics,
     Request, Activity, Filter, Security, Logger, CORS, Compression, Helmet } = require('./middlewares')
 const LatencyStart = Start('latency')
 const LatencyEnd = End('latency')
 const swaggerUi = require('swagger-ui-express')
 
 
 //defualt middlewares
 const middlewares = { BodyParserJSON, BodyParserURLEncoded, UUID, LatencyStart, LatencyEnd, Metrics, Request, Filter, Activity, Logger, CORS, Compression, Helmet }
 
 /**
  * Express monad. Accepts the config and openspec3x in json format.
  * config : {
  *  port: 8080
  * }
  */
 const Express = config => async specs => {
     const path2OpMap = {}
     const RegisterSpecs = config => specs => async express => {
         //express.use('/api/v3/inventories/spec',require('express').static('public'))
 
 
         // Load Specs, Register endpoints
         const RegisterSpec = config => express => async spec => {
 
             RegisterSwaggerSchema(config)(spec)(express)
             RegisterSwaggerUI(config)(spec)(express)
 
 
             //RegisterOpenAPIValidator(config)(spec)(express)
             // Endpoint execution
             const expRegEndpoint = spec => path => method => express => {
                 const operationid = spec.paths[path][method].operationId
                 path2OpMap[method+path] = operationid
                 const Exec = req => res => async func => load((func))(req, res)
 
                 const expLoadOperation = () => {
                     const HandleError = req => res => async err => {
                         const SendError = res => async err => { res.status((err.status) ? err.status : 500).header('content-type', 'application/json').send(err) }
                         const LogError = req => async err => req.Logger.Error(err)
                         return await $M(SendError(res), LogError(req))(err)
                     }
                     return async (req, res, next) => {
                         req['operationid'] = operationid
                         req['Config'] = config
                         await $M(Exec(req)(res))(`${process.cwd()}/src/functions/${operationid}`).catch(HandleError(req)(res))
                     }
                 }
                 const expRegPath2Operation = func => { express[method](path.replace('{', ':').replace('}', ''), 
                 Security(config)(spec.paths[path][method].security), 
                 ...m2valList(config.rest.middlewares || {}),
                 OpenApiValidator.middleware({ apiSpec: spec, validateRequests: true, validateResponses: true }),
                 func); return express }
                 return $(Hint(`[${method}][${(operationid) ? 'secured' : 'unsecured'}]${path} => ${operationid}`), expRegPath2Operation, expLoadOperation)()
             }
             const expRegisterPath = cat => val => { expRegEndpoint(cat.spec)(cat.path)(val)(cat.express); return cat }
             const expRegisterPaths = cat => val => { lfold({ express: cat.express, spec: cat.spec, paths: cat.paths, path: val })(expRegisterPath)(Object.keys(cat.paths[val])); return cat }
 
             return lfold({ express, spec, paths: spec.paths })(expRegisterPaths)(Object.keys(spec.paths))['express']
         }
 
         return $M($R(express), Wait, lmap(RegisterSpec(config)(express)))(specs)
     }
 
     const RegisterUncaughtExceptionHandler = async express => {
         process.on('uncaughtException', function (err) { console.log({ type: 'crash', name: process.env.NAME, title: 'Crash', trace: err }) })
         return express
     }
     const RegisterShutdownHandler = signals => async express => {
         const onShutdown = express => { Print('Shutting down...'); process.exit(0) }
         const handler = func => val => process.on(val, func)
         signals.forEach(handler(onShutdown))
         return express
     }
 
     const RegisterErrorHandler = async express => express.use((err, req, res, next) => {
         const ReturnError = res => async err => res.status((err.status) ? err.status : 500).json(err)
         const LogError = async err => req.Logger.Error(({ status: (err.status) ? err.status : 500, operationId : getOperationId(req)(path2OpMap)(err), title: (err.title) ? err.title : formatTitle(err), errors: (err.message) ? formatErrors(err) : err.errors, category: 'AUTOVALIDATION' }))
         return LogError(err).then(ReturnError(res))
 
     })
 
     const RegisterSwaggerUI = config => spec => express => {
         
         const register = url => spec => {
             (url) ? express.use(url, Security(config)([{ jwt: [] }]), swaggerUi.serve, swaggerUi.setup(spec)) : ""
             return express
         }
         return (config.rest.docs) ? register(config.rest.docs[spec.info.title])(spec) : express
     }
 
     const RegisterSwaggerSchema = config => spec => express => {
         const execute = spec => async function (req, res) {
             //console.log(req)
             const schema = spec['components']['schemas'][req.params.name]
             const returnSchema = res => schema => res.send(schema)
             const returnError = res => res.send(404)
             return (schema) ? returnSchema(res)(schema) : returnError(res)
         }
         return (config.rest.schemas) ? express.get(`${config.rest.schemas[spec.info.title]}/:name`, execute(spec)) : express
     }
     const RegisterOpenAPIValidator = config => spec => async express => (config.rest.autoValidation == undefined || config.rest.autoValidation) ? express.use(OpenApiValidator.middleware({ apiSpec: spec, validateRequests: true, validateResponses: true })) : express
 
     const RegisterMiddlewares = config => async express => {
         
         express.disable('x-powered-by')
         const RegisterMiddleware = express => middleware => express.use(middleware)
         const RegisterDefaultMiddlewares = async express => { $(lmap(RegisterMiddleware(express)), m2valList)(middlewares); return express }// register default middlewares
         //const RegisterCustomMiddlewares = async express => { $(lmap(RegisterMiddleware(express)), m2valList)(config.rest.middlewares || {}); return express }// add new / overrite 
         return $M(RegisterDefaultMiddlewares)(express)
     }
 
     const StartListener = config => async express => express.listen(config.rest.port || 8080, () => Print(`Express listening at : ${config.rest.port || 8080}`))
     return $M(
         Hint('Started HTTP listener................'), StartListener(config),
         Hint('Attached uncaught exception handler..'), RegisterUncaughtExceptionHandler,
         Hint('Attached shutdown handler............'), RegisterShutdownHandler(['SIGINT', 'SIGTERM', 'SIGHUP']),
         Hint('Added defualt Error handler..........'), RegisterErrorHandler,
         Hint('Registering Specs....................'), RegisterSpecs(config)(specs),
         Hint('Registering middleware...............'), RegisterMiddlewares(config))(require('express')())
 }
 
 //Export
 module.exports = { Express }