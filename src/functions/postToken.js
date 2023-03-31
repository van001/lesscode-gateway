module.exports =  async function(req, res) {
    req.Logger.Info('POST Mapping...')
    res.send({issued_token_type : 'access_token', token_type : 'Bearer', access_token: 'www', refresh_token : 'www', expires_in : 123})
}