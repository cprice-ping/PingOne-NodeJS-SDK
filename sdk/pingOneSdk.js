import fetch, { Headers } from "node-fetch";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const p1ApiRoot = `${process.env.APIROOT}/environments/${process.env.ENVID}`
const p1AuthRoot = `${process.env.AUTHROOT}/${process.env.ENVID}`
const p1OrchestrateRoot = `${process.env.ORCHESTRATEAPIROOT}/v1/company/${process.env.ENVID}`


/********************************************
 * Helper Functions
 *******************************************/

// Obtains an access token for the PingOne worker application used to call PingOne API endpoints.
// This is a naive implementation that gets a token every time.
// It could be improved to cache the token and only get a new one when it is expiring.
const getWorkerToken = async () => {
  
  var urlencoded = new URLSearchParams();
  urlencoded.append("grant_type", "client_credentials");

  const apiEndpoint = "as/token"
  const url = `${p1AuthRoot}/${apiEndpoint}`
  
  // console.log("Worker URL: ", url)
  
  const response = await fetch(url,
    {
      method: 'post',
      body: urlencoded,
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': "Basic " + btoa(process.env.WORKERID+":"+process.env.WORKERSECRET)
    }
  })
  .then(res => res.json())
  .then(data => { return data })
  .catch(err => console.log(`${apiEndpoint} Error: ${err.code}`))
  
  return response.access_token;
}

// Obtains an "SDK token" that is passed into the DV widget to execute the flow policy.
// The session token is passed in via 'global.sessionToken' to make it available to the flow.
// exports.getSdkToken = async (sessionToken) => {
export async function getSdkToken(policyId, sessionToken) {
  const requestBody = {
    policyId: policyId
  };

  if (sessionToken) {
    requestBody.global = { sessionToken };
  }

  console.log("SDK Request: ", requestBody)

  const apiEndpoint = "sdktoken"
  const url = `${p1OrchestrateRoot}/${apiEndpoint}`

  const headers = new Headers
  headers.append("Content-Type", "application/json")
  headers.append("X-SK-API-KEY", process.env.DVAPIKEY)

  const response = await fetch(url, {
    method: 'post',
    headers: headers,
    body: JSON.stringify(requestBody)
  })
  .then(res => res.json())
  .then(data => { return data })
  .catch(err => console.log(`${apiEndpoint} Error: ${err.code}`))

  // console.log(response)
  return response
} 

async function makeApiCall(url, method, body, extraHeaders){
  //TODO: `extraHeaders` needs to account for HAL events on `Content-Type` and additional ones
  console.log(`API Call: ${method} - ${url}`)
  const accessToken = await getWorkerToken();

  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  headers.append('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(url, {
    method: method,
    headers: headers,
    body: JSON.stringify(body)
  })
  .then(res => res.json())
  .then(data => { return data })
  .catch(err => console.log(`${url} Error: ${err}`))
  // console.log("API Response: ", response)
  return response
} 

/**
 * An asynchronous delay function using setTimeout to pause execution.
 * @param {number} ms The number of milliseconds to delay.
 */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Polls (GET) an API until the status changes from it's intitial text value.
 * @param {string} url The URL of the API to poll.
 * @param {string} status The starting string that you want to see when it changes.
 * @returns {Promise<any>} A promise that resolves when the status is not what was requested.
 */
async function pollApiCall(url, status) {
  console.log(`Polling ${url} for status ${status}`)
  const accessToken = await getWorkerToken();
  while (true) {
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${accessToken}`
        }
      });
      // console.log("Poll API Response: ", JSON.stringify(response))
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Checking status:', data.status);  // Optional: for debug purposes

      if (data.status !== status) {
          // console.log(`Current Status is ${status}.`);
          return data;
      }
      // Wait for the specified interval before the next request
      await delay(2000);
    } catch (error) {
        console.error('Failed to fetch from API:', error);
        // Optional: decide whether to retry or handle errors differently
        // await delay(2000);  // Wait before retrying  
    }
  }
}

/*** Helper Functions ****

/********************************************
 * PingOne Sessions
 *******************************************/

// Retrieves the session identified by the provided token.
export async function getSession(sessionToken) {

  const accessToken = await getWorkerToken();
  const apiEndpoint = "sessions"

  const url = `${p1ApiRoot}/${apiEndpoint}/me`

  const response = await fetch(url, {
    method: 'get',
    headers: {
      "Content-Type": "application/json",
      'Authorization': `Bearer ${accessToken}`,
      'Cookie': `ST=${sessionToken}`
    }
  })
  .then(res => res.json())
  .then(data => { return data })
  .catch(err => console.log(`${apiEndpoint} Error: ${err.code}`))
  
  return response;
}

// Updates the session identified by the provided token.
export async function updateSession(sessionToken, session) {
  const accessToken = await getWorkerToken();
  const apiEndpoint = "sessions"

  const url = `${p1ApiRoot}/${apiEndpoint}/me`

  const response = await fetch(url, {
    method: 'put',
    headers: {
      "Content-Type": "application/json",
      'Authorization': `Bearer ${accessToken}`,
      'Cookie': `ST=${sessionToken}`
    },
    body: JSON.stringify(session)
  })
  .then(res => res.json())
  .then(data => { return data })
  .catch(err => console.log(`${apiEndpoint} Error: ${err.code}`))
  
  return response;
}
/* PingOne Sessions */

/******************************************
* PingOne Authorize
******************************************/
export async function getAuthorizeDecision(decisionEndpoint, params) {

  const apiEndpoint = `decisionEndpoints/${decisionEndpoint}`
  const url = `${p1ApiRoot}/${apiEndpoint}`
  
  const body = { parameters: params }
  
  // console.log(parameters)
  
  const response = await makeApiCall(url, "post", body)
  
  return response;
}

/******************************************
* PingOne Credentials
******************************************/
export async function pairDigitalWallet(applicationInstanceID, digitalWalletApplicationID, userId) { 

  const apiEndpoint = `users/${userId}/digitalWallets`
  const url = `${p1ApiRoot}/${apiEndpoint}`
  
  const body = {
    "digitalWalletApplication": {
        "id": digitalWalletApplicationID
    },
    "applicationInstance": {
        "id": applicationInstanceID
    }  
  }
  
  const response = await makeApiCall(url, "post", body)

  return response;
}

export async function getCredentialTransaction(transactionId) { 

  const apiEndpoint = `presentationSessions`
  const url = `${p1ApiRoot}/${apiEndpoint}/${transactionId}`
  
  const response = await pollApiCall(url, "INITIAL")
  
  return response;
}

/******************************************
* PingOne Protect
******************************************/
export async function getProtectDecision(body) { 

  const apiEndpoint = `riskEvaluations`
  const url = `${p1ApiRoot}/${apiEndpoint}`
  
  const response = await makeApiCall(url, "post", body)

  return response;
}

export async function updateProtectDecision(id, status) { 

  const body = {
    "completionStatus": status
  }

  const apiEndpoint = `riskEvaluations/${id}/event`
  const url = `${p1ApiRoot}/${apiEndpoint}`
  
  const response = await makeApiCall(url, "post", body)
  
  return response;
}
/* PingOne Protect */

/********************************************
 * PingOne MFA
 *******************************************/
export async function createMfaDevice(userId, body){
  
  const apiEndpoint = `users/${userId}/devices`
  const url = `${p1ApiRoot}/${apiEndpoint}`
  
  const response = await makeApiCall(url, "post", body)
  
  return response
}

export async function activateMfaDevice(userId, deviceId, body){
  
  const accessToken = await getWorkerToken();

  const apiEndpoint = `users/${userId}/devices/${deviceId}`
  const url = `${p1ApiRoot}/${apiEndpoint}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      "Content-Type": "application/vnd.pingidentity.device.activate+json",
      "Authorization": `Bearer ${accessToken}`
    },
    body: JSON.stringify(body)
  })
  .then(response => response.text())
  .then(data => { return data })
  .catch(err => console.log(`${apiEndpoint} Error: ${err.code}`))
  
  return response
}

export async function createMfaDeviceAuthentication(userId){
  
  const apiEndpoint = `deviceAuthentications`
  const url = `${p1ApiRoot}/${apiEndpoint}`
  
  const body = {
      "user": {
        "id": userId
      } 
    }

  const response = await makeApiCall(url, "post", body)
  
  return response
}

export async function validateMfaDeviceAuthentication(deviceAuthId, body){
  
  const accessToken = await getWorkerToken();

  const apiEndpoint = `deviceAuthentications/${deviceAuthId}`
  const url = `${p1ApiRoot}/${apiEndpoint}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      "Content-Type": "application/vnd.pingidentity.assertion.check+json",
      "Authorization": `Bearer ${accessToken}`
    },
    body: JSON.stringify(body)
  })
  .then(res => res.json())
  .then(data => { return data })
  .catch(err => console.log(`${apiEndpoint} Error: ${err.code}`))
  
  return response
}
/* PingOne MFA */

/*********************************************
 * PingOne Images API
*********************************************/

// Uploads an base64 JPEG image to P1 Images API.
export async function uploadImage(filename, image) {
  
  const accessToken = await getWorkerToken();

  const apiEndpoint = `images`
  const url = `${p1ApiRoot}/${apiEndpoint}`
  
  const response = await fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'image/jpeg',
      'Authorization': `Bearer ${accessToken}`,
      'content-disposition': `attachment; filename=${filename}`
    },
    body: image
    })
    .then(res => res.json())
    .catch(err => console.log(`${apiEndpoint} Error: ${err.code}`))
  
  return response;
}
//* PingOne Images API */
