
const { lmap } = require('lesscode-fp')

const formatTitle = err => {
    switch(err.status){
        case 401 : return "Unauthorized"
        case 404 : return 'Not Found'
        case 405 : return "Method Not Allowed"
        case 413 : return "Payload Too Large"
        case 415 : return "Unsupported Media Type"
        default : return 'Bad Request'
    }

}

const getOperationId = req => map => err =>  map[req.method.toLowerCase()+err.path]

const formatErrors = err => {
    if (err.errors) {
        const formatError = err => {
            const split = err.path.split('.')
            const type = split[1]
            const name = split.slice(2).join('.')
            if (err.errorCode && err.errorCode.startsWith('pattern')) {
                return { label : name, msg: 'format is invalid', type : type}
            } else if (err.errorCode && err.errorCode.startsWith('minLength')) {
                return { label : name, msg: err.message , type : type}
            } else if (err.errorCode && err.errorCode.startsWith('required')) {
                return { label : name, msg: 'is required', type : type}
            } else if (err.errorCode && err.errorCode.startsWith('format')) {
                return { label : name, msg: 'format is invalid', type : type}
            } else if (err.errorCode && err.errorCode.startsWith('readOnly')) {
                return { label : name, msg: 'is read-only', type : type}
            } else if (err.errorCode && err.errorCode.startsWith('enum')) {
                return { label : name, msg: err.message , type : type}
            } else if (err.errorCode && err.errorCode.startsWith('type')) {
                return { label : name, msg: err.message , type : type}
            } else if (err.message && err.message.startsWith('unsupported media type')) {
                return { label : name, msg: err.message , type : type}
            } else {
                return { msg: err.message , type : type}
            }

        }
        return lmap(formatError)(err.errors)
    }
}
module.exports = { formatErrors, formatTitle,  getOperationId } 