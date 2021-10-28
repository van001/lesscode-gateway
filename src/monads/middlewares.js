/**
 * Conatin all the defualt middleware definition
 */
const { $M, Print, lmap } = require('lesscode-fp')
const { v1: uuidv1 } = require('uuid')
const cors = require('cors')
const bodyParser = require('body-parser')
const ua = require('useragent')
const jwt = require('jwt-simple')
const dotenv = require('dotenv').config()
const compression = require('compression')

module.exports = {
    BodyParserJSON: bodyParser.json(),
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
        let postBody = req.body
        if(postBody) {
            postBody = delete postBody.token
            postBody = delete postBody.password
            postBody = delete postBody.secret
        }
        
        if (!req.path.endsWith('health')) {
            Print(JSON.stringify(
                {
                    type: 'request',
                    uuid: req.uuid,
                    env: process.env.ENV,
                    region: process.env.REGION,
                    name: process.env.NAME,
                    user: req.user,
                    method: req.method,
                    useragent: ua.parse(req.headers['user-agent']),
                    url: req.path,
                    query: req.query,
                    body: req.body,
                    length: req.get('content-length'),
                    ts: Date.now()
                }))
        }
        next()
    },
    Activity: (req, res, next) => {
        const extract = req => res => {
            console.log(req.method)
            switch (req.method) {
                case 'POST': { return { albertId: res.id } }
                case 'GET': { return '' }
                case 'DELETE': { return '' }
                case 'PUT': { return '' }
                case 'PATCH': { return '' }
            }

        }
        let oldSend = res.send
        res.send = function (data) {
            if (!req.path.endsWith('health') && res.statusCode < 300) {
                res.id = data.albertId
                Print(JSON.stringify(
                    {
                        type: 'activity',
                        uuid: req.uuid,
                        env: process.env.ENV,
                        region: process.env.REGION,
                        name: process.env.NAME,
                        method: req.method,
                        url: req.path,
                        ts: Date.now(),
                        user: req.user,
                        data : extract(req)(res)
                    }))
            }
            res.send = oldSend // set function back to avoid the 'double-send'
            return res.send(data) // just call as normal with data
        }
        next()

    },
    Security: config => types => (req, res, next) => {
        const list = (types) ? types : []
        if (list.length == 0) return next()
        const ReturnError = res => async err => { const e = await err; res.status(e.status).send(e) }
        const Next = async () => next()
        const ValidateJWT = secret => async token => {
            //console.log(secret)
            //console.log(token)
            const ThrowInvalidTokenErrorError = err => { throw { status: 401, title: 'Unauthorized.', errors: [{ msg: 'Invalid token.', category: 'Authorization' }] } }
            const Decode = secret => async token => jwt.decode(token, secret, false, 'HS256')
            const AddToRequest = req => async jwt => { req['JWT'] = jwt; return jwt }
            return $M(AddToRequest(req), Decode(secret))(token).catch(ThrowInvalidTokenErrorError)

        }
        const GetJWT = async req => {
            const ThrowMissingAuthHeaderError = async () => { throw { status: 401, title: 'Unauthorized.', errors: [{ msg: 'Missing authorization header.', category: 'Authorization' }] } }
            const ReturnJWT = async req => req.header('Authorization').split(' ')[1]
            return req.header('Authorization') ? ReturnJWT(req) : ThrowMissingAuthHeaderError()
        }

        const ApplySecurity = req => res => sec => {
            if (sec.jwt) { $M(Next, ValidateJWT(config.JWT_TOKEN_SECRET), GetJWT)(req).catch(ReturnError(res)) }
        }
        lmap(ApplySecurity(req)(res))(list)
    },
    Logger: (req, res, next) => {
        req['Logger'] = {
            Info: async (msg) => $M(JSON.parse, Print)(JSON.stringify({ type: 'info', uuid: req.uuid, name: process.env.NAME, method: req.method, url: req.path, operationid: req.app.settings.operationid, msg: msg, ts: Date.now() })),
            Warning: async (msg) => $M(JSON.parse, Print)(JSON.stringify({ type: 'warning', uuid: req.uuid, name: process.env.NAME, method: req.method, url: req.path, operationid: req.app.settings.operationid, msg: msg, ts: Date.now() })),
            Error: async (err) => await $M(JSON.parse, Print)(JSON.stringify({ type: 'error', uuid: req.uuid, name: process.env.NAME, method: req.method, url: req.path, operationid: req.app.settings.operationid, status: err.status, title: err.title, category: err.category, errors: err.errors, trace: err.trace, ts: Date.now() }))
        }
        next()
    },
    CORS: cors(),
    Compression: compression()
}