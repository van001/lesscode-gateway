const { print } = require('lccore')
const {DirBrowser, SwaggerValidate, FileReadUtf8} = require('../src/monads/fs')

test('FilereadUtf8........', async () => {
    const result = await FileReadUtf8(`${process.cwd()}/rest/vethospital.yaml`)
    expect(result.length).toBe(1864)
})

test('DirBrowser........', async () => {
    const result = await (DirBrowser()(SwaggerValidate))('rest')
    expect(result.length).toBe(2)
})
