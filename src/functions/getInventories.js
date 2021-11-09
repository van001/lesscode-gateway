
module.exports = async function (req, res) {
    const data = { albertId: "123", status : "active", createdBy : "Neelesh V"}
    res.status(200).send(data)
}