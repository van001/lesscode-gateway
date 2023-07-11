const dotenv = require('dotenv').config()
const { $M, Print, FileRead } = require('lesscode-fp')
const AWS = require('aws-sdk')
const JWT = require('jsonwebtoken')
const base64url = require("base64url")
const config = require('./config')
const fs = require('fs')

const KMS = new AWS.KMS({ region: process.env.AWS_DEFAULT_REGION || process.env.REGION} || process.env.AWS_REGION)

const Sign = key => async data => {
    const token = {
        header: base64url(JSON.stringify({ alg: 'RS256', type: 'JWT' })),
        payload: base64url(JSON.stringify(data))
    }
    const Format = async signature => (token.header + '.' + token.payload + '.' + signature)
    const Sign2 = async data => new Promise((resolve, reject) =>
        KMS.sign({ KeyId: key, SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256', MessageType: 'RAW', Message: Buffer.from(token.header + '.' + token.payload) },
            (err, data) => (err) ? reject(err) : resolve(data.Signature.toString("base64")
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, ''))))
    return $M(Format, Sign2)(data)
}

const Verify = cert => async token => {
    const Verify2 = cert => async  token=> new Promise((resolve, reject) => JWT.verify(token, cert, (err, decoded) => (err) ? reject(err) : resolve(token)))
    return $M(Verify2(cert))(token)
}

module.exports = { Sign, Verify }
