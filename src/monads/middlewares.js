/**
 * Conatin all the defualt middleware definition
 */
const { $M, Print, lmap, lmapA, Wait, mslice } = require('lesscode-fp')
const { v1: uuidv1 } = require('uuid')
const cors = require('cors')
const bodyParser = require('body-parser')
const ua = require('useragent')
const jwt = require('jwt-simple')
const dotenv = require('dotenv').config()
const compression = require('compression')
const helmet  = require('helmet')

module.exports = {
    BodyParserJSON: bodyParser.json({ limit: 1000000 }),
    BodyParserURLEncoded: bodyParser.urlencoded({ extended: false }),
    UUID: (req, res, next) => { req.uuid = req.headers.uuid || uuidv1(); res.header('uuid', req.uuid); next() },
    Start: label => (req, res, next) => { if (!req.timers) req.timers = {}; { const start = Date.now(); req.timers[label] = { start, end: start } }; if (next) { next() } }, // Timer start
    End: label => (req, res, next) => { res.on('finish', function () { if (req.timers) { req.timers[label].end = Date.now() } }); if (next) { next() } }, // Timer End
    Metrics: (req, res, next) => {
        res.on('finish',
            () => {
                if (!req.path.endsWith('health')) {
                    Print(JSON.stringify(
                        {
                            type: 'metrics',
                            uuid: req.uuid,
                            env: process.env.ENV,
                            region: process.env.REGION,
                            name: process.env.NAME,
                            method: req.method,
                            status: res.statusCode,
                            url: req.path,
                            operationId: req.operationid,
                            length: res.get('content-length'),
                            latency: (req.timers && req.timers.latency) ? req.timers.latency.end - req.timers.latency.start : 0,
                            latencyin: (req.timers && req.timers.latencyin) ? req.timers.latencyin.end - req.timers.latencyin.start : 0,
                            ts: Date.now()
                        }))
                }
            }
        )
        next()
    },
    Request: (req, res, next) => {
        let postBody = Object.assign({}, req.body)
        if (postBody) {
            delete postBody.token
            delete postBody.password
            delete postBody.secret
        }

        if (!req.path.endsWith('health')) {
            let token = req.query.token
            token ? delete req.query.token : ''
            Print(JSON.stringify(
                {
                    type: 'request',
                    uuid: req.uuid,
                    env: process.env.ENV,
                    region: process.env.REGION,
                    name: process.env.NAME,
                    user: req.User,
                    method: req.method,
                    useragent: ua.parse(req.headers['user-agent']),
                    url: req.path,
                    operationId: req.operationid,
                    query: req.query,
                    body: postBody,
                    length: req.get('content-length'),
                    ts: Date.now()
                }))
                if(token) req.query.token = token
        }
        
        next()
    },
    Activity: (req, res, next) => {
        if(req.path.indexOf('/spec') != -1) { next(); return}
        extractAction = req => {
            switch (req.method) {
                case 'POST': return "created"
                case 'DELETE': return "deleted"
                case 'GET': return 'viewed'
                case 'PUT': return 'replaced'
                case 'PATCH': return (req.body.action) ? req.body.action : 'updated'
            }
        }

        const extractId = req => res => id => (res ? res[id] : null) || req.params[id] || req.query[id] || req.headers[id]

        const printActivity = req => lst => index => data => {

            if (!req.path.endsWith('health') && res.statusCode < 300) {
                Print(JSON.stringify(
                    {
                        type: 'activity',
                        uuid: req.uuid,
                        env: process.env.ENV,
                        region: process.env.REGION,
                        name: process.env.NAME,
                        action: extractAction(req),
                        uri: req.path,
                        operationId: req.operationid,
                        created: Date.now(),
                        tenantId: extractId(req)((req.JWT) ? req.JWT : {})('tenantId'),
                        partition: (req.JWT) ? req.JWT.partition : null,
                        user: req.User,
                        id: extractId(req)(data)('id') || extractId(req)(data)('albertId'),
                        parentId: extractId(req)(data)('parentId'),
                        data: (index != -1) ? req.body[index] : req.body || {},
                        expiresAt: extractId(req)(data)('x-albert-expires') ? Date.now() + 3600000 : null
                    }))
            }
        }

        let oldSend = res.send
        res.send = function (data) {
            switch (req.method) {
                case 'PATCH': (Array.isArray(req.body)) ? lmapA(printActivity(req))(req.body) : printActivity(req)(data)(-1)(data); break
                case 'POST':
                case 'PUT': (Array.isArray(data)) ? lmapA(printActivity(req))(data) : printActivity(req)(data)(-1)(data); break
                default: printActivity(req)(data)(-1)(data)

            }
            res.send = oldSend // set function back to avoid the 'double-send'
            res.data = data
            res.send(data) // just call as normal with data
        }
        next()

    },
    Filter: (req, res, next) => {
        let oldSend = res.send
        res.send = function (data) {
            if (req.query.filter && res.statusCode < 300 && data && data.Items) {
                data.Items = lmap(mslice(req.query.filter))(data.Items)
            } else if (req.query.filter && res.statusCode < 300 && data && typeof data === 'object') {
                
                data = mslice(req.query.filter)(data)
            }
            res.send = oldSend // set function back to avoid the 'double-send'
            res.send(data) // just call as normal with data
        }
        next()
    },
    Security: config => types => (req, res, next) => {
        
        if (req.path.endsWith('.js') || req.path.endsWith('.css') | req.path.endsWith('.png')) {
            next()
        } else {
            const list = (types) ? types : []
            if (list.length == 0) return next()
            const ReturnError = res => async err => { const e = await err; res.status(e.status).send(e) }
            const Next = async () => next()
            const ValidateJWT = secret => async token => {
                const ThrowInvalidTokenErrorError = err => { throw { status: 401, title: 'Unauthorized.', errors: [{ msg: 'Invalid token.', category: 'Authorization' }], trace: err.toString() } }
                const Decode = secret => async token => jwt.decode(token, secret, false, 'HS256')
                const AddToRequest = req => async jwt => { req['JWT'] = jwt; req['User'] = { id: jwt.id || jwt.subject, name: jwt.name }; return jwt }
                return $M(AddToRequest(req), Decode(secret))(token).catch(ThrowInvalidTokenErrorError)

            }
            const GetJWT = async req => {
                const ThrowMissingAuthHeaderError = async () => { throw { status: 401, title: 'Unauthorized.', errors: [{ msg: 'Missing authorization header.', category: 'Authorization' }] } }
                const ReturnJWT = async req => req.header('Authorization').split(' ')[1]
                return req.query.token || (req.header('Authorization') ? ReturnJWT(req) : ThrowMissingAuthHeaderError())
            }

            const ApplySecurity = req => res => sec => {
                if (sec.jwt) { $M(Next, ValidateJWT(config.JWT_TOKEN_SECRET), GetJWT)(req).catch(ReturnError(res)) }
            }
            lmap(ApplySecurity(req)(res))(list)

        }

    },
    Logger: (req, res, next) => {
        req['Logger'] = {
            Info: async (msg) => $M(JSON.parse, Print)(JSON.stringify({ type: 'info', uuid: req.uuid, name: process.env.NAME, method: req.method, url: req.path, operationId: req.operationid, msg: msg, ts: Date.now() })),
            Warning: async (msg) => $M(JSON.parse, Print)(JSON.stringify({ type: 'warning', uuid: req.uuid, name: process.env.NAME, method: req.method, url: req.path, operationId: req.operationid, msg: msg, ts: Date.now() })),
            Error: async (err) => await $M(JSON.parse, Print)(JSON.stringify({ type: 'error', uuid: req.uuid, name: process.env.NAME, method: req.method, url: req.path, operationId: err.operationId || req.operationid, status: err.status, user: req.User, title: err.title, category: err.category, errors: err.errors, trace: err.trace, ts: Date.now() }))
        }
        //console.log = req['Logger'].Info
        next()
    },
    CORS: cors(),
    Compression: compression(),
    Helmet: helmet()
}