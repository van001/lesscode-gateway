module.exports =  async function(req, res) {
    req.Logger.Info('POST Mapping...')
    res.send({...req.body, response: true})
}