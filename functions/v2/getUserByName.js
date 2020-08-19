module.exports =  async function(req, res, next) {
    res.send(` hello ${req.url}`)
}