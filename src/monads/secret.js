// Written in FP style...
const { $M } = require('lesscode-fp')
const AWS = require('aws-sdk')
const client = new AWS.SecretsManager({ region: process.env.AWS_DEFAULT_REGION });

const ToJSON = async str => JSON.parse(str)
const ExtractData = async data => ('SecretString' in data) ? data.SecretString : (new Buffer(data.SecretBinary, 'base64').toString('ascii'))
const QuerySM = async secretName => client.getSecretValue({ SecretId: secretName }).promise()
const GetSecrets = async secretName =>  $M(ToJSON,ExtractData,QuerySM)(secretName)

module.exports = { GetSecrets }
