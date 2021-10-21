const dotenv = require('dotenv').config()
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const expect = chai.expect;
chai.use(chaiHttp);

const AlbertTests = token => url => {
    return {

        // config  : { token, url, path }
        postEmptyPayload: config => {
            describe("Auto Tests...", function (done) {
                it('Empty payload : 400 : should retun the list of required fields',
                    (done) => {
                        chai.request(url)
                            .post(config.path)
                            .set({ 'Authorization': token, 'x-albert-expires': true })
                            .send({})
                            .end((err, res) => {
                                //console.log(res.body)
                                res.should.have.status(400);
                                expect(res).to.have.header('Access-Control-Allow-Origin', '*')

                                const check = error => {
                                    expect(error.label).to.deep.equal(config.required[error.label])
                                }
                                res.body.errors.map(check)
                                done()
                            })
                    })
            })
        }
    }
}

module.exports = { AlbertTests }