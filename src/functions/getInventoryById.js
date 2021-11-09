module.exports = async function (req, res) {
    const data = {
        albertId: req.params.id,
        name: 'PVC Gloves',
        description: 'Safety Equipment',
        companyId: 'COM1',
        companyName: 'ABC',
        Minimum: [ { locationId: 'LOC1', minimum: 100}],
        category: 'Equipment',
        unitCategory: 'units',
        status: "active",
        createdAt: '2021-07-29T20:20:20.041Z',
        createdBy: "Neelesh V"
    }
    res.status(200).send(data)
}