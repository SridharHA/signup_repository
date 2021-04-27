const AWS = require('aws-sdk-mock');
const sinon = require('sinon');
const assert = require('chai').assert;
var proxyquire = require('proxyquire');
//const expect = require('chai').expect;
const app = require('../index');


describe('SignUp Function', async function () {

    it("signup success", async () => {
        let data = { body: JSON.stringify({ email: "abc@gmail.com",role: "Admin",createddate: "12/03/2021",name:"", }) };
        var signUpUserStub = sinon.stub().yields(null,"data");
       
        AWS.mock('DynamoDB.DocumentClient', 'put', function (params, callback) {
            callback(null,"success");
        });
        var testedModule = proxyquire('../index.js', {
            'amazon-cognito-identity-js': {
              'CognitoUserPool': function () {
                return {
                    signUp: signUpUserStub
                }
              }
            }
          });
        let result = await testedModule.handler(data);
        assert.equal(result.statusCode, 200);
        AWS.restore('DynamoDB.DocumentClient');

    })


    it("signup failure from cognito", async () => {
        let data = { body: JSON.stringify({ email: "abc@gmail.com",role: "Admin",createddate: "12/03/2021",name:"", }) };
        var signUpUserStub = sinon.stub().yields("data",null);
       
        var testedModule = proxyquire('../index.js', {
            'amazon-cognito-identity-js': {
              'CognitoUserPool': function () {
                return {
                    signUp: signUpUserStub
                }
              }
            }
          });
        let result = await testedModule.handler(data);
        assert.equal(result.statusCode, 500);
       

    })

    it("database insert failure", async () => {
        let data = { body: JSON.stringify({ email: "abc@gmail.com",role: "Admin",createddate: "12/03/2021",name:"", }) };
        var signUpUserStub = sinon.stub().yields(null,"data");
       
        AWS.mock('DynamoDB.DocumentClient', 'put', function (params, callback) {
            callback("failure",null);
        });
        var testedModule = proxyquire('../index.js', {
            'amazon-cognito-identity-js': {
              'CognitoUserPool': function () {
                return {
                    signUp: signUpUserStub
                }
              }
            }
          });
        let result = await testedModule.handler(data);
        assert.equal(result.statusCode, 500);
        AWS.restore('DynamoDB.DocumentClient');

    })
})