
const { lmap } = require('lesscode-fp')

const formatTitle = err => {
    switch(err.status){
        case 404 : return "Not founnd"
        default : return 'Bad request'
    }

}

const formatErrors = err => {
    if (err.errors) {
        const formatError = err => {
            const name = err.path.split('.')[2]
            if (err.errorCode && err.errorCode.startsWith('pattern')) {
                return { label : name, msg: 'format is invalid', category : 'REST'}
            } else if (err.errorCode && err.errorCode.startsWith('minLength')) {
                return { label : name, msg: err.message , category : 'REST'}
            } else if (err.errorCode && err.errorCode.startsWith('required')) {
                return { label : name, msg: 'is required', category : 'REST'}
            } else if (err.errorCode && err.errorCode.startsWith('format')) {
                return { label : name, msg: 'format is invalid', category : 'REST'}
            } else if (err.errorCode && err.errorCode.startsWith('readOnly')) {
                return { label : name, msg: 'is read-only', category : 'REST'}
            } else if (err.errorCode && err.errorCode.startsWith('enum')) {
                return { label : name, msg: err.message , category : 'REST'}
            } else if (err.errorCode && err.errorCode.startsWith('type')) {
                return { label : name, msg: err.message , category : 'REST'}
            } else if (err.message && err.message.startsWith('unsupported media type')) {
                return { label : name, msg: err.message , category : 'REST'}
            } else {
                return { msg: err.message , category : 'REST'}
            }

        }
        return lmap(formatError)(err.errors)
    }
}
module.exports = { formatErrors, formatTitle }