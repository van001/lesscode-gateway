/**
 * All file system related monads.
 */
const { Print, $M } = require('lesscode-fp')
const fs = require('fs').promises
const yaml = require('yaml')
const parser = require('@apidevtools/swagger-parser')

/**
 * File Reader
 */
const FileRead = encoding => async name => await fs.readFile(name, encoding)
const FileReadUtf8 = FileRead('utf-8')

/**
 * Validates swagger and returns json. 
 */
const SwaggerValidate = async content => parser.validate(content)

/**
 * Call this method to browse through all the files within a specified directory.
 * TPDO: Add filter through config.
 * It accects a function that could transform the content.
 * @param {*} name 
 */
const DirBrowser = config => action => async name => {
    Print(`Loading dir ${process.cwd()}/${name}`)
    const dir = await fs.opendir(`${process.cwd()}/${name}`);
    const files = []
    for await (const file of dir) {
        Print(`Loading ${process.cwd()}/${name}/${file.name} `)
        files.push(await $M(action)(`${process.cwd()}/${name}/${file.name}`))
    }
    return files
}

//$M(DirBrowser()($M(SwaggerValidate)))('rest').then(print).catch(err => print(`Failed to load express ${err}`))

// Export
module.exports = { DirBrowser, FileRead, FileReadUtf8, SwaggerValidate }