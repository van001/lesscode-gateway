/**
 * FP functions for express. 
 * 1. Create new express instance           :   expCreate 
 * 2. Register SPecs or Endpoints directly  :   expRegSpec or expRegEndpoint 
 * 3. Start express                         :   expStart
 */
const { $, lfold, hint, print, memoize} = require('lccore')
const express = require('express')
const load = memoize((path) => $(hint(`Loaded ${path}...`), require)(path))
// Endpoint execution
const expRegEndpoint = basepath => path => method => operationid => express => {
    const expLoadOperation = basepath => operationid => {

        return async (req, res, next) => {
            try {
                try {
                    await load((`${process.cwd()}/functions${basepath}/${operationid}`))(req, res, next)
                } catch (err) {
                    
                    next(err)
                }
            }
            catch (err) { print(`failed to load ${process.cwd()}/functions${basepath}/${operationid}...`); next(err) }
        }
    }
    const expRegPath2Operation = express => basepath => path => method => func => { express.instance[method](basepath+path.replace('{', ':').replace('}', ''), func); return express }
    return $(hint(` ${basepath}${path}[${method}] => ${operationid}...`), expRegPath2Operation(express)(basepath)(path)(method), expLoadOperation(basepath))(operationid)
}
// Load Specs, Register endpoints
const expRegSpecs = specs => express => {
    const expRegisterEndpoint = express => path => method => operation => $(hint(`registered ${method} : ${path}`), expExecute(express)(method)(path))(operation)
    const expRegisterPath = cat => val => { expRegEndpoint(cat.spec.basePath)(cat.path)(val)((cat.paths[cat.path][val].operationId))(cat.express); return cat }
    const expRegisterPaths = cat => val => { lfold({ express: cat.express, spec: cat.spec, paths: cat.paths, path: val })(expRegisterPath)(Object.keys(cat.paths[val])); return cat }
    const expRegisterSpec = cat => val => lfold({ express: cat, spec: val, paths: val.paths })(expRegisterPaths)(Object.keys(val.paths))['express']
    return lfold(express)(expRegisterSpec)(specs)
}

//Start / Listen
const expStart = port => express => express.instance.listen(port, () => print(`Listening at ${port}`))

// Create
const expCreate = () => ({ instance: express() })

// Export
module.exports = { expCreate, expStart, expRegSpecs }