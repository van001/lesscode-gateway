
module.exports = async function (req, res) {
    const data = {
        total : 2,
        Items :[
            { albertId: "123", status : "active", createdBy : "Neelesh V"},
            { albertId: "245", status : "active", createdBy : "Neelesh V"},

        ]
    }
    req.Logger.Info('Get Inv...')
    //throw "Erro..."
    res.status(200).send(data)
}