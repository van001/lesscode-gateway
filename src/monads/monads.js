const $M = (...ms) => (ms.reduce((f,g) => x => g(x)['then'](f)))

const getName = async name => name
const sayHello = async name =>  `hello ${name}`

const msg = $M(sayHello,getName)
msg('neelesh').then (res => console.log(res))