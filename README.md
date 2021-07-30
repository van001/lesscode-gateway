# Overview
![Architecture](https://github.com/van001/lcgateway/blob/master/lcgateway.png)

lesscode-gateway provide support for multiple client server protocols like REST, GraqhQL, MQM (Message Q Messages). Simply drop your openapi 3.0, graqlql or mqm files (vai open spec) and lessacode-gateway will automatically map the endpoints to it's execution (functions). 

# Features
- Multiple protocol support using single function.
- Auto openapi 3.0 (REST) contract validation.
- Built-in observability (stdout) - Request, Metrics (latency) & Error.
- Auto JWT validation.

# Usage

```
const dotenv = require('dotenv').config()
const { $M, $, Print, m2valList } = require('lesscode-fp')
const { Gateway, GetSecrets } = require('./src/gateway')

const LogCrash = async err => Print(JSON.stringify({ type: 'crash', name: process.env.NAME, err }))
const StartServer = async env => Gateway(env)

// Monadic composition...
$M(StartServer, GetSecrets)((`${process.env.ECS_CLUSTER_NAME}`)).catch(LogCrash)

```
