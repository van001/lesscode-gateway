module.exports =  async function(req, res) {
    throw {title : 'GET Failed',  errors : [{ msg: 'Tennant id is not a number' }]}
    req.Logger.Info('Get Tennant...')
    res.send(req.body)
}