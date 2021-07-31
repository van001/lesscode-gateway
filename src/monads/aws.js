/**
 * FP monads for AWS 
 */
const dotenv = require('dotenv').config()
const { $M } = require('lesscode-fp')
const { ToJSON } = require('./convertors')
const AWS = require('aws-sdk')
const S3 = new AWS.S3()
const SM = new AWS.SecretsManager({ region: process.env.AWS_DEFAULT_REGION })

// Secremt Manager
const ExtractData = async data => ('SecretString' in data) ? data.SecretString : (new Buffer(data.SecretBinary, 'base64').toString('ascii'))
const QuerySM = async secretName => SM.getSecretValue({ SecretId: secretName }).promise()
const GetSecrets = async secretName => $M(ToJSON, ExtractData, QuerySM)(secretName)


// S3
const GetObject = async config => S3.getObject(config).promise()

//Exports
module.exports = { GetObject, GetSecrets }