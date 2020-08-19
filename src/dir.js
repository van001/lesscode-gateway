const { print } = require('lccore') // lccore
const fs = require('fs')
/**
 * Call this method to load all the files within a specified directory.
 * @param {*} name 
 */
async function mDirLoad(name) {
    try {
        print(`Loading dir ${process.cwd()}/${name}...`)
        const dir = await fs.promises.opendir(`${process.cwd()}/${name}`);
        const files = []
        for await (const file of dir) {
            files.push(require(`${process.cwd()}/${name}/${file.name}`))
        }
        return files
    } catch (err) {
        print(`[ERROR] : Failed to load REST specs : ${name} not found : ${err}`)
        return []
    }
}

// Export
module.exports = { mDirLoad }