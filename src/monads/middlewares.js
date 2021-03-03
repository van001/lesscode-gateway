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
    Start: (req, res, next) => { req['Start'] = Date.now(); next() },
    End: (req, res, next) => { res.on("finish", function () { res['End'] = Date.now() }); next() },
    Metrics: (req, res, next) => {
        res.on("finish",
             () => {
                Print(JSON.stringify(
                    {
                        uuid: req.uuid,
                        env: process.env.ENV,
                        region: process.env.REGION,
                        name : process.env.NAME,
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
                name : process.env.NAME,
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
            Info: async (msg) => { $M($R({ msg }), Print)(JSON.stringify({ uuid: req.uuid,   name : process.env.NAME, type: 'info', method: req.method, url: req.path, operationid: req.operationid, msg: msg, ts: Date.now() })) },
            Warning: async (msg) => { $M($R({ msg }), Print)(JSON.stringify({ uuid: req.uuid, name : process.env.NAME, type: 'warning', method: req.method, url: req.path, operationid: req.operationid, msg: msg, ts: Date.now() })) },
            Error: async (err) => { $M($R({ err }), Print)(JSON.stringify({ uuid: req.uuid,   name : process.env.NAME, type: 'error', method: req.method, url: req.path, operationid: req.operationid, err: err, ts: Date.now() })) }
        }
        next()
    },
    CORS: cors()
}