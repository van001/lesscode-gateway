const AWS = require('aws-sdk')
const S3 = new AWS.S3()

const GetObject = async config => S3.getObject(config).promise()
const ToMap = data => JSON.parse(data.Body.toString('utf-8'))

module.exports = { GetObject, ToMap }