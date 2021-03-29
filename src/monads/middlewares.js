/**
 * Conatin all the defualt middleware definition
 */
const { $M, Print } = require('lesscode-fp')
const { v1: uuidv1 } = require('uuid')
const cors = require('cors')
const bodyParser = require('body-parser')
const ua = require('useragent')
const $R = ret => async res => ret

module.exports = {
    BodyParserJSON: bodyParser.json(),
    BodyParserURLEncoded: bodyParser.urlencoded({ extended: false }),
    UUID: (req, res, next) => { req.uuid = req.headers.uuid || uuidv1(); res.header('uuid', req.uuid); next() },
    Start: label => (req, res, next) => { if (!req.timers) req.timers = {}; { const start = Date.now(); req.timers[label] = { start, end: start } }; if (next) { next() } }, // Timer start
    End: label => (req, res, next) => { res.on("finish", function () { if (req.timers) { req.timers[label].end = Date.now() } }); if (next) { next() } }, // Timer End
    Metrics: (req, res, next) => {
        res.on("finish",
            () => {
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
        )
        next()
    },
    Request: (req, res, next) => {
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
        next()
    },
    Security: types => (req, res, next) => { 
        const list = (types)? types : []

        next()},
    Logger: (req, res, next) => {
        req['Logger'] = {
            Info: async (msg) => $M(JSON.parse, Print)(JSON.stringify({ type: 'info', uuid: req.uuid, name: process.env.NAME, method: req.method, url: req.path, operationid: req.app.settings.operationid, msg: msg, ts: Date.now() })) ,
            Warning: async (msg) => $M(JSON.parse, Print)(JSON.stringify({ type: 'warning', uuid: req.uuid, name: process.env.NAME, method: req.method, url: req.path, operationid: req.app.settings.operationid, msg: msg, ts: Date.now() })) ,
            Error: async (err) => $M(JSON.parse, Print)(JSON.stringify({ type: 'error', uuid: req.uuid, name: process.env.NAME, method: req.method, url: req.path, operationid: req.app.settings.operationid, status : err.status, title : err.title, category : err.category, msg : err.msg, trace : err.trace, ts: Date.now() })) 
        }
        next()
    },
    CORS: cors()
}