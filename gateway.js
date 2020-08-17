const { $, lfold, hint, print , lmap, lappend, lflat} = require('lccore')


// Endpoint execution
const expOperation = path => operation => {
    return async (req, res, next) => {
        try {
            const func = require('./functions' + path + '/' + operation)
            try {await func(req,res,next)}catch(err){next(err)}
        }
        catch (err) { next(err)}
    }
}
const expExecute = express => method => path => func => { express[method](path.replace('{', ':').replace('}', ''), func); return express }

// Load Specs, Register endpoints
const expRegisterEndpoint = express => path => method => operation => $(hint(`registered ${method} : ${path}`), expExecute(express)(method)(path))(operation)
const expRegisterPath = cat => val => { expRegisterEndpoint(cat.express)(`${cat.spec.basePath}${cat.path}`)(val)(expOperation(`${cat.spec.basePath}`)(`${cat.paths[cat.path][val].operationId}`)); return cat }
const expRegisterPaths = cat => val => { lfold({ express: cat.express, spec: cat.spec, paths: cat.paths, path: val })(expRegisterPath)(Object.keys(cat.paths[val])); return cat }
const expRegisterSpec = cat => val => lfold({ express: cat, spec: val, paths: val.paths })(expRegisterPaths)(Object.keys(val.paths))['express']

//Start / Listen 
const expListen = port => express => express.listen(port, () => print(`Listening at ${port}`))
const expStart = port => specs => express => $(expListen(port), lfold(express)(expRegisterSpec))(specs)

// Create
const expCreate = () =>  ({ express :require('express')()})

$(print,expCreate)([require('./rest/swagger.json')])





