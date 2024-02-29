//https://qigzuvctd5pfb4gcqugtjnbsc40odvoa.lambda-url.us-east-1.on.aws/

import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
const ddbClient = new DynamoDBClient({ region: "us-east-1" }); 

const globals = {
    DEFAULT_BASE_ID: "apppHKPOOlTMWd8C4",
    DEFAULT_TABLE_ID: "tblSMmFtgOdQD5W9w",
    DEFAULT_DYNAMO_TABLE_NAME: "voiceflow-twilio-collections-logs",
    AIRTABLE_TOKEN: "pat562IRmmXUsUbdj.a2ad65922100ce3d92b9cb1141d1bff4b9b53b8ba51378eb5950397ea9662726",
    ROWOFFSET: 1,
};

const getCurrentDate = (yearonly) => {
    let today = new Date();
    console.log(today);

    let dd = String(today.getUTCDate()).padStart(2, '0');
    let mm = String(today.getUTCMonth() + 1).padStart(2, '0'); // Enero es 0
    let yyyy = today.getUTCFullYear();
    let hours = String(today.getUTCHours()).padStart(2, '0');
    let minutes = String(today.getUTCMinutes()).padStart(2, '0');
    let seconds = String(today.getUTCSeconds()).padStart(2, '0');
    let milliseconds = String(today.getUTCMilliseconds()).padStart(3, '0');

    return (yearonly) ? `${mm}/${dd}/${yyyy}` : `${mm}/${dd}/${yyyy} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};

const assembleResponse = async (status, message) => {
    let object = {
        statusCode: status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: message
    }
        if (globals.LOGMODE) console.log(`Assembling Response: ${JSON.stringify(object,null,2)}` )
    return object;
};

const writeToAirtable = async (token, baseID, tableID, dataToWrite) => {
    console.log(`C. writeToAirtable first line`);

    const url = `https://api.airtable.com/v0/${baseID}/${tableID}`;
    const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
    const payload = { "fields": dataToWrite };

    try {
        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        console.log('POSTED SUCCESSFULLY:', data);
    } catch (error) {
        console.error('POSTED FAILED:', error);
    }

}

const writeToDynamoDB = async (dataToWrite, tableName) => {
   
    const params = {
        TableName: tableName,
        Item: {
            "Timeframe": { S: dataToWrite.Timeframe },
            "Message": { S: dataToWrite.Message },
            "Session": { S: dataToWrite.Session },
        }
    };

    try {
        const data = await ddbClient.send(new PutItemCommand(params));
        console.log(`Success - Message is: "${dataToWrite.Message}", and Metadata is: ${JSON.stringify(data, null, 2)} `);
    } catch (err) {
        console.error("Error in writeToDynamoDB: ", err);
    }
};

export const handler = async (event, context) => {

    console.log('*********** LOADING V1 ***********')
    console.log(JSON.stringify(event,null,2));
    console.log('*************************************')

    if (event.requestContext.http.method !== 'POST') {
        return await assembleResponse(400,'Method is not allowed'); 
    }

    let eventBody;
        if (event.body) {
            eventBody = JSON.parse(event.body);
        } else { 
            return await assembleResponse(400,'This request has no payload.'); 
        }

    let message; 
        if (!eventBody.message) {
            return await assembleResponse(400, 'Message is missing.');
        } else {
            message = eventBody.message;
        }

    let baseID = (!eventBody.airtable_base_id) ? globals.DEFAULT_BASE_ID : eventBody.base_id; //Only for AIRTABLE logging.
    let tableID = (!eventBody.airtable_table_id) ? globals.DEFAULT_TABLE_ID : eventBody.table_id; //Only for AIRTABLE logging.
    /////////
    let tableName = (!eventBody.dynamo_table_name) ? globals.DEFAULT_DYNAMO_TABLE_NAME : eventBody.dynamo_table_name; //Only for DYNAMO logging.;
    /////////
    let sessionID = (!eventBody.session) ? "No Session Specified" : eventBody.session; 
    let timeframe = (!eventBody.timeframe) ? getCurrentDate(false) : eventBody.timeframe; 

    console.log('2. Variables assigned.')

    let information = 
    {
        "Timeframe": timeframe,
        "Message": message,
        "Session": sessionID,
    };

    await writeToDynamoDB (information, tableName);
    await writeToAirtable (globals.AIRTABLE_TOKEN, baseID, tableID, information);

    console.log('3. Dynamo function called.')

    let res = {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: `Logged successfully`
    }
    
    //console.log(JSON.stringify(res, null, 2))
    console.log('*********** ENDING SCRIPT ***********')
    return res;

};

// (async () => {
//     ////console.log(JSON.stringify(
//         await handler({
//                         version: '2.0',
//                         routeKey: '$default',
//                         rawPath: '/',
//                         rawQueryString: '',
//                         headers: {
//                         'content-length': '107',
//                         'x-amzn-tls-version': 'TLSv1.2',
//                         'x-forwarded-proto': 'https',
//                         'postman-token': 'cd2f5956-44b3-4298-88e9-d10dfba4bc74',
//                         'x-forwarded-port': '443',
//                         'x-forwarded-for': '181.43.127.230',
//                         accept: '*/*',
//                         'x-amzn-tls-cipher-suite': 'ECDHE-RSA-AES128-GCM-SHA256',
//                         'x-amzn-trace-id': 'Root=1-65a09bf8-79d301b26d42233e44bb8237',
//                         host: 'ytzivrzj76ejwc2vdbnzwladdm0nvubi.lambda-url.us-east-1.on.aws',
//                         'content-type': 'application/json',
//                         'accept-encoding': 'gzip, deflate, br',
//                         'user-agent': 'PostmanRuntime/7.36.0'
//                         },
//                         requestContext: {
//                         accountId: 'anonymous',
//                         apiId: 'ytzivrzj76ejwc2vdbnzwladdm0nvubi',
//                         domainName: 'ytzivrzj76ejwc2vdbnzwladdm0nvubi.lambda-url.us-east-1.on.aws',
//                         domainPrefix: 'ytzivrzj76ejwc2vdbnzwladdm0nvubi',
//                         http: {
//                             method: 'POST',
//                             path: '/',
//                             protocol: 'HTTP/1.1',
//                             sourceIp: '181.43.127.230',
//                             userAgent: 'PostmanRuntime/7.36.0'
//                         },
//                         requestId: '9c8c29ec-37aa-4d1e-bc32-fcd3abf82fdf',
//                         routeKey: '$default',
//                         stage: '$default',
//                         time: '12/Jan/2024:01:55:04 +0000',
//                         timeEpoch: 1705024504027
//                         },
//                         body: '{\r\n' +
//                         '    "session": "This is another test"\r\n' +         
//                         '    "message": "This is another test"\r\n' +
//                         '}',
//                         isBase64Encoded: false
//                         })
// })() 




// {
//     "sheetid": "",
//     "tab": "01/11/2024",
//     "message": "This is a test"
// }

//https://ytzivrzj76ejwc2vdbnzwladdm0nvubi.lambda-url.us-east-1.on.aws/



