let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server/index');

// Assertion Style
chai.should();
chai.use(chaiHttp);

describe('API Server',()=>{
    // Test Get Route
    describe("/api",()=>{
        it('Connection Ok',(done)=>{
            chai.request(server).get('/api').end((err,res)=>{
                res.should.have.status(200);
                done();
            });
        })
    })

})