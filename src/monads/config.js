const { Print, $M } = require('lesscode-fp')
const {GetObject, ToMap } = require('./aws')
const {FileReadUtf8 } = require('./fs')
const Bucket = `${process.env.DOMAIN}.config`
const Key = `${process.env.NAME}.${process.env.ECS_CLUSTER_NAME}.config.json`
const GetLocalConfig = async msg => $M(FileReadUtf8)(Key)
const Config = async () => $M( await $M(ToMap,GetObject)({ Bucket, Key}).catch($M(GetLocalConfig,Print)))

module.exports = { Config }
