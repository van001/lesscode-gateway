
const { lmap } = require('lesscode-fp')

const formatTitle = err => {
    if(err) return 'Bad request'
}

const formatErrors = err => {
    console.log(err)
    if( err ){
        const formatError = err => {
            if(err.errorCode && err.errorCode.startsWith('pattern')){
                return `'${err.path.split('.')[2]}' format is invalid`
            }else if( err.errorCode && err.errorCode.startsWith('minLength')){
                return `'${err.path.split('.')[2]}' ${err.message}`
            }else if(err.errorCode && err.errorCode.startsWith('required')){
                return `'${err.path.split('.')[2]}' is required`
            }else if(err.errorCode && err.errorCode.startsWith('format')){
                return `'${err.path.split('.')[2]}' format is invalid`
            }else if(err.errorCode && err.errorCode.startsWith('readOnly')){
                return `'${err.path.split('.')[2]}' is read-only`
            }else{
                return err
            }
        }
        return lmap(formatError)(err)
    }
}
module.exports = { formatErrors, formatTitle }