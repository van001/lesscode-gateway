
const { lmap } = require('lesscode-fp')

const formatTitle = err => {
    if(err) return 'Bad request'
}

const formatErrors = err => {
    if( err ){
        const formatError = err => {
            if(err.errorCode.startsWith('pattern')){
                return `'${err.path.substring(6,err.path.length)}' format is invalid`
            }else if( err.message.startsWith('should NOT be shorter')){
                return `'${err.path.substring(6,err.path.length)}' ${err.message}`
            }else if(err.message.startsWith('should have required property')){
                return `'${err.path.substring(6,err.path.length)}' is required`
            }else if(err.message.startsWith('should match format')){
                return `'${err.path.substring(6,err.path.length)}' format is invalid`
            }else if(err.errorCode.startsWith('readOnly')){
                return `'${err.path.substring(6,err.path.length)}' is read-only`
            }else{
                return err
            }
        }
        return lmap(formatError)(err)
    }
}
module.exports = { formatErrors, formatTitle }