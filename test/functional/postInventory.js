const dotenv = require('dotenv').config()
const chai = require('chai');
const chaiHttp = require('chai-http');
const config = require('../config.js')
const should = chai.should();
const expect = chai.expect;
chai.use(chaiHttp);
const { postEmptyPayload } = require('../testlib')


postEmptyPayload(config.params.postInventory)

