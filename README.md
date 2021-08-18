# Overview
![Architecture](https://github.com/van001/lcgateway/blob/master/lcgateway.png)

lesscode-gateway provide support for multiple client server protocols like REST, GraqhQL, MQM (Message Q Messages). Simply drop your openapi 3.0 spec and lesscode gateway will automatically convert into graplql oamd mqm spec (vai open spec) map all the endpoints to it's single execution (functions). 

# Features
- Multiple protocol support using single function.
- Auto openapi 3.0 (REST) contract validation.
- Built-in observability (stdout) - Request, Metrics (latency) & Error.
- Auto JWT validation.

# Usage

- Install the lesscode packages.
```
npm install lesscode-fp 
npm install lesscode-gateway
```
or
```
yarn add lesscode-fp 
yarn add lesscode-gateway
```


- Create a javscrript file with the following code
```
const { $M, $, Print, m2valList } = require('lesscode-fp')
const { Gateway } = require('lesscode-gateway')

const LogCrash = async err => Print(JSON.stringify({ type: 'crash', name: process.env.NAME, err }))
const StartServer = async env => Gateway(env)

// Monadic composition...
$M(StartServer)({}).catch(LogCrash)

```
