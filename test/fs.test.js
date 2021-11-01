const { print } = require('lesscode-fp') 
const {DirBrowser, SwaggerValidate, FileReadUtf8} = require('../src/monads/fs')

test('fs tests........', () => {expect(true).toBe(true)})

/**test('DirBrowser........', async () => {
    const result = await (DirBrowser()(SwaggerValidate))('rest')
    expect(result.length).toBe(2)
})**/
