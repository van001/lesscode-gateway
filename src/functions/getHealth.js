module.exports = async function (req, res) { 
    console.log('..................................')
    res.send({ status: 'ok', ts: Date.now() }) 
}