
const { lmap } = require('lesscode-fp')

const formatTitle = err => {
    if (err) return 'Bad request'
}

const formatErrors = err => {
    console.log(err)
    if (err) {
        const formatError = err => {
            const name = err.path.split('.')[2]
            if (err.errorCode && err.errorCode.startsWith('pattern')) {
                return `'${name}' format is invalid`
            } else if (err.errorCode && err.errorCode.startsWith('minLength')) {
                return `'${name}' ${err.message}`
            } else if (err.errorCode && err.errorCode.startsWith('required')) {
                return `'${name}' is required`
            } else if (err.errorCode && err.errorCode.startsWith('format')) {
                return `'${name}' format is invalid`
            } else if (err.errorCode && err.errorCode.startsWith('readOnly')) {
                return `'${name}' is read-only`
            } else if (err.errorCode && err.errorCode.startsWith('enum')) {
                return `'${name}' ${err.message}`
            } else if (err.errorCode && err.errorCode.startsWith('type')) {
                return `${err.message}  ${err.message}`
            } else if (err.message && err.message.startsWith('unsupported media type')) {
                return `${err.message} `
            } else if (err.message && err.message.startsWith('Authorization header required')) {
                return `${err.message}`
            } else {
                return err.message
            }


        }
        return lmap(formatError)(err)
    }
}
module.exports = { formatErrors, formatTitle }