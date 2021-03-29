const ToMap = data => JSON.parse(data.Body.toString('utf-8'))
const ToJSON = async str => JSON.parse(str)

module.exports = { ToJSON, ToMap }
