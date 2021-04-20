/** 
 * Lambda Function that would do the following:
 * 1. Read the data from API gateway
 * 2. Create an user in congnito userpool
 * 3. Insert the record to dynamodb
 * 4. Return the successful records or error codes to caller.
 */

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    const poolData = {
        UserPoolId: "us-east-1_vn1MDgmkf", // user pool id   
        ClientId: "4d3kn5m89trjsd0husu4h982ng" // client id
    };
    const pool_region = 'us-east-1';
    console.log(event);
    let inputRequest = JSON.parse(event.body);

    // Assigning the input parameters to response object which is used for db insert
    let response = {};
    response.email_address = inputRequest.email;
    response.role = inputRequest.role;
    response.created_date = inputRequest.createddate;
    response.name = inputRequest.name;
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var attributeList = [];
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "email", Value: inputRequest.email }));
    let errorMessage;

    // Header for response method
    let headers = {
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials" : true,
        "Access-Control-Allow-Methods": "*",
        "Accept": "*/"
    }

    // Cognito signup method to create the user in userpool
    let signup = new Promise((resolve, reject) => {
        userPool.signUp(inputRequest.email, inputRequest.password, attributeList, null, function (err, result) {
            if (err) {
                console.log(err);
                errorMessage = err.message;
                resolve(false);
            }
            else {

                console.log('result is ');
                console.log(result);
                resolve(true);
            }
        });
    });
    let signupResult = await signup;
    let dbInsertResult;
    // Insert the records to dynamodb table if signup is successful
    if (signupResult) {
        let dbInsert = new Promise((resolve, reject) => {
            docClient.put({
                TableName: 'user-table',
                Item: response
            }, (err, data) => {
                if (err) {
                    console.log("Error: for request - ", err);
                    errorMessage = err.message;
                    resolve(false);
                } else {
                    console.log("Success ", data)
                    resolve(true);
                }
            })
        });
        dbInsertResult = await dbInsert;
        // return success response if db insert is successful
        if (dbInsertResult) {
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(
                    {
                        message: "Signup Completed"
                    },
                    null,
                    2
                ),
            };
        }

        // return success response if db insert is unsuccessful
        else {
            return {
                statusCode: 500,
                headers: headers,
                body: JSON.stringify(
                    {
                        message: "Signup Completed but DB Inssert Failed"
                    },
                    null,
                    2
                ),
            };
        }
    }
    // return error response if signup is unsuccessful
    else {
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify(
                {
                    message: errorMessage
                },
                null,
                2
            ),
        };
    }
}