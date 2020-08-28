/**
 * FP functions for express. 
 * 1. Create new express instance           :   expCreate 
 * 2. Register SPecs or Endpoints directly  :   expRegSpec or expRegEndpoint 
 * 3. Start express                         :   expStart
 */
const { $, lfold, hint, print, memoize } = require('lccore')
const fs = require('fs')
const { OpenApiValidator } = require('express-openapi-validator')
const yamlParser = require('yaml')
// express initialization...
const express = require('express')()
const bodyParser = require("body-parser")
express.use(bodyParser.urlencoded({ extended: false }));
express.use(bodyParser.json());

const swaggerUi = require('swagger-ui-express')
const load = memoize((path) => $(hint(`Loaded ${path}...`), require)(path)) //memoize 

// Load Specs, Register endpoints
const expRegSpec = spec => express => {
    // Endpoint execution
    const expRegEndpoint = spec => path => method => express => {
        const operationid = spec.paths[path][method].operationId
        const basepath = spec.basePath
        const expLoadOperation = () => {
            return async (req, res, next) => {
                try {
                    //print(spec.definitions)
                    try {
                        await load((`${process.cwd()}/functions/${operationid}`))(req, res, next)
                    } catch (err) {
                        next(err)
                    }
                }
                catch (err) { print(`failed to load ${process.cwd()}/functions/${operationid}...`); next(err) }
            }
        }
        const expRegPath2Operation = func => { express[method](path.replace('{', ':').replace('}', ''), func); return express }
        return $(hint(`${path}[${method}] => ${operationid}...`), expRegPath2Operation, expLoadOperation)()
    }

    const expRegisterPath = cat => val => { expRegEndpoint(cat.spec)(cat.path)(val)(cat.express); return cat }
    const expRegisterPaths = cat => val => { lfold({ express: cat.express, spec: cat.spec, paths: cat.paths, path: val })(expRegisterPath)(Object.keys(cat.paths[val])); return cat }
    //const spec = yamlParser.parse(fs.readFileSync(`${process.cwd()}/${file}`, 'utf8'))
    //express.use('/', swaggerUi.serve, swaggerUi.setup(spec))
    new OpenApiValidator({
        apiSpec: spec,
        validateRequests: true, // (default)
        validateResponses: true, // false by default
    }).installSync(express);
    express.use((err, req, res, next) => {
        // format error
        res.status(err.status || 500).json({
            message: err.message,
            errors: err.errors,
        });
    });
    return lfold({ express, spec, paths: spec.paths })(expRegisterPaths)(Object.keys(spec.paths))['express']
}

//Start / Listen
const expStart = port => express => express.listen(port, () => print(`Listening at ${port}`))

// Create
const expCreate = () => express

// Export
module.exports = { expCreate, expStart, expRegSpec }