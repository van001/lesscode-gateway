module.exports =  async function(req, res) {
    //throw "Testing..."
    console.log(req.body)
    res.send(req.body)
}