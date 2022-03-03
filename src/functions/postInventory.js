async function epochTime() {
    let dateToday = new Date();
    expiresAt = Math.round((dateToday.getTime() / 1000) + 300 * 60)
    return (expiresAt);
}
module.exports = async function (req, res) {
    const add = { id: "123", status : "active", createdBy : "Neelesh V"}
    res.status(201).send([{ ...req.body[0], ...add }])
}